import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting) private settingRepo: Repository<AppSetting>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private async getOrCreateSetting() {
    const [existing] = await this.settingRepo.find({ take: 1 });
    if (existing) return existing;
    return this.settingRepo.save(this.settingRepo.create({ demoMode: false }));
  }

  async getDemoMode() {
    const setting = await this.getOrCreateSetting();
    if (!setting.demoMode) return { enabled: false, users: [] };
    const users = await this.userRepo.find({
      where: { actif: true },
      select: ['matricule', 'nom', 'prenom', 'role'],
      order: { role: 'ASC', nom: 'ASC' },
    });
    return { enabled: true, users: users.filter(u => u.matricule) };
  }

  async setDemoMode(enabled: boolean) {
    const setting = await this.getOrCreateSetting();
    setting.demoMode = enabled;
    await this.settingRepo.save(setting);
    return { enabled: setting.demoMode };
  }
}
