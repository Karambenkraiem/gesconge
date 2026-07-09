import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AppSetting } from './app-setting.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting, User])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
