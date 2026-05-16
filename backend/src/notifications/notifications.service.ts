import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, TypeNotification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async create(dto: {
    destinataire_id: string;
    conge_id?: string;
    type: TypeNotification;
    message: string;
  }) {
    const notif = this.notifRepo.create(dto);
    return this.notifRepo.save(notif);
  }

  async findForUser(userId: string) {
    return this.notifRepo.find({
      where: { destinataire_id: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async marquerLu(id: string, userId: string) {
    await this.notifRepo.update({ id, destinataire_id: userId }, { lu: true });
    return { ok: true };
  }

  async marquerTousLus(userId: string) {
    await this.notifRepo.update({ destinataire_id: userId, lu: false }, { lu: true });
    return { ok: true };
  }

  async countUnread(userId: string) {
    const count = await this.notifRepo.count({ where: { destinataire_id: userId, lu: false } });
    return { count };
  }
}
