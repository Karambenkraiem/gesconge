import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, Role, Equipe } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepo.find({ select: ['id','email','nom','prenom','role','equipe','soldeConge','soldeInitial','telephone','matricule','actif','createdAt'] });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const { password, ...rest } = user;
    return rest;
  }

  async create(dto: Partial<User> & { password: string }) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hashed });
    await this.userRepo.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async update(id: string, dto: Partial<User> & { password?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    await this.userRepo.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async setSoldeInitial(id: string, solde: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    user.soldeInitial = solde;
    user.soldeConge = solde;
    await this.userRepo.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async deactivate(id: string) {
    await this.userRepo.update(id, { actif: false });
    return { message: 'Utilisateur désactivé' };
  }

  async reactivate(id: string) {
    await this.userRepo.update(id, { actif: true });
    return { message: 'Utilisateur réactivé' };
  }

  async deleteForever(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    await this.userRepo.remove(user);
    return { message: 'Utilisateur supprimé définitivement' };
  }

  // Adds 2 days monthly to all active non-admin users
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async addMonthlySolde() {
    const users = await this.userRepo.find({
      where: { actif: true },
    });
    const now = new Date();
    for (const user of users) {
      if (user.role === Role.SUPER_ADMIN || user.role === Role.CHEF_EXPLOITATION) continue;
      const last = user.lastMonthlyAdd;
      if (last) {
        const sameMonth = last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear();
        if (sameMonth) continue;
      }
      user.soldeConge = parseFloat((Number(user.soldeConge) + 2).toFixed(1));
      user.lastMonthlyAdd = now;
      await this.userRepo.save(user);
    }
    console.log('[CRON] Soldes congés mis à jour (+2j)');
  }

  async updateMyProfile(userId: string, dto: {
    nom?: string; prenom?: string; email?: string;
    telephone?: string; matricule?: string; password?: string;
  }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    await this.userRepo.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async getChefExploitation() {
    return this.userRepo.find({ where: { role: Role.CHEF_EXPLOITATION, actif: true } });
  }
}
