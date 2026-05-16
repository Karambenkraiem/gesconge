import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongesService } from './conges.service';
import { CongesController } from './conges.controller';
import { Conge } from './conge.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Conge, User]), NotificationsModule],
  controllers: [CongesController],
  providers: [CongesService],
})
export class CongesModule {}
