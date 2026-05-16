import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conge, StatutConge, TypeConge } from './conge.entity';
import { User, Role } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TypeNotification } from '../notifications/notification.entity';

@Injectable()
export class CongesService {
  constructor(
    @InjectRepository(Conge) private congeRepo: Repository<Conge>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(user: { userId: string; role: Role }) {
    const isManager = user.role === Role.CHEF_EXPLOITATION || user.role === Role.SUPER_ADMIN;
    if (isManager) {
      return this.congeRepo.find({ order: { createdAt: 'DESC' } });
    }
    return this.congeRepo.find({
      where: { demandeur_id: user.userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyConges(userId: string) {
    return this.congeRepo.find({
      where: { demandeur_id: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: {
    dateDebut: string; dateFin: string; typeConge: TypeConge; motif?: string; adresse_conge?: string;
  }) {
    const demandeur = await this.userRepo.findOne({ where: { id: userId } });
    if (!demandeur) throw new NotFoundException('Utilisateur non trouvé');

    const debut = new Date(dto.dateDebut);
    const fin = new Date(dto.dateFin);
    if (fin < debut) throw new BadRequestException('La date de fin doit être après la date de début');

    const msPerDay = 86400000;
    const nombreJours = Math.ceil((fin.getTime() - debut.getTime()) / msPerDay) + 1;

    if (dto.typeConge === TypeConge.ANNUEL) {
      if (Number(demandeur.soldeConge) < nombreJours) {
        throw new BadRequestException(
          `Solde insuffisant: ${demandeur.soldeConge}j disponibles, ${nombreJours}j demandés`,
        );
      }
    }

    const conge = this.congeRepo.create({
      demandeur_id: userId,
      demandeur,
      dateDebut: dto.dateDebut,
      dateFin: dto.dateFin,
      nombreJours,
      typeConge: dto.typeConge,
      motif: dto.motif,
      adresse_conge: dto.adresse_conge,
      solde_au_depot: Number(demandeur.soldeConge),
      statut: StatutConge.EN_ATTENTE,
    });
    await this.congeRepo.save(conge);

    // Notify all chefs exploitation
    const chefs = await this.userRepo.find({ where: { role: Role.CHEF_EXPLOITATION, actif: true } });
    for (const chef of chefs) {
      await this.notificationsService.create({
        destinataire_id: chef.id,
        conge_id: conge.id,
        type: TypeNotification.NOUVELLE_DEMANDE,
        message: `Nouvelle demande de congé de ${demandeur.prenom} ${demandeur.nom} (${nombreJours}j du ${dto.dateDebut} au ${dto.dateFin})`,
      });
    }

    return conge;
  }

  async decider(congeId: string, managerId: string, dto: {
    statut: StatutConge.APPROUVE | StatutConge.REFUSE;
    remarque?: string;
  }) {
    const conge = await this.congeRepo.findOne({ where: { id: congeId } });
    if (!conge) throw new NotFoundException('Congé non trouvé');
    if (conge.statut !== StatutConge.EN_ATTENTE) {
      throw new BadRequestException('Ce congé a déjà été traité');
    }

    const demandeur = await this.userRepo.findOne({ where: { id: conge.demandeur_id } });
    if (!demandeur) throw new NotFoundException('Demandeur non trouvé');

    conge.statut = dto.statut;
    conge.remarqueManager = dto.remarque;
    conge.manager_id = managerId;
    conge.dateDecision = new Date();
    await this.congeRepo.save(conge);

    if (dto.statut === StatutConge.APPROUVE && conge.typeConge === TypeConge.ANNUEL) {
      demandeur.soldeConge = parseFloat(
        (Number(demandeur.soldeConge) - conge.nombreJours).toFixed(1),
      );
      await this.userRepo.save(demandeur);
    }

    // Notify the demandeur
    const approved = dto.statut === StatutConge.APPROUVE;
    await this.notificationsService.create({
      destinataire_id: conge.demandeur_id,
      conge_id: conge.id,
      type: approved ? TypeNotification.CONGE_APPROUVE : TypeNotification.CONGE_REFUSE,
      message: approved
        ? `Votre congé du ${conge.dateDebut} au ${conge.dateFin} a été approuvé`
        : `Votre congé du ${conge.dateDebut} au ${conge.dateFin} a été refusé${dto.remarque ? `: ${dto.remarque}` : ''}`,
    });

    return conge;
  }

  async annuler(congeId: string, userId: string) {
    const conge = await this.congeRepo.findOne({ where: { id: congeId } });
    if (!conge) throw new NotFoundException('Congé non trouvé');
    if (conge.demandeur_id !== userId) throw new ForbiddenException();
    if (conge.statut !== StatutConge.EN_ATTENTE) {
      throw new BadRequestException('Seules les demandes en attente peuvent être annulées');
    }
    conge.statut = StatutConge.ANNULE;
    await this.congeRepo.save(conge);
    return conge;
  }

  async uploadCertificat(congeId: string, filePath: string, userId: string) {
    const conge = await this.congeRepo.findOne({ where: { id: congeId } });
    if (!conge) throw new NotFoundException('Congé non trouvé');
    conge.certificat_medical = filePath;
    return this.congeRepo.save(conge);
  }

  async getStats() {
    const total = await this.congeRepo.count();
    const en_attente = await this.congeRepo.count({ where: { statut: StatutConge.EN_ATTENTE } });
    const approuve = await this.congeRepo.count({ where: { statut: StatutConge.APPROUVE } });
    const refuse = await this.congeRepo.count({ where: { statut: StatutConge.REFUSE } });
    return { total, en_attente, approuve, refuse };
  }
}
