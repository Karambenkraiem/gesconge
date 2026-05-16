import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Conge } from '../conges/conge.entity';

export enum TypeNotification {
  NOUVELLE_DEMANDE = 'nouvelle_demande',
  CONGE_APPROUVE = 'conge_approuve',
  CONGE_REFUSE = 'conge_refuse',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'destinataire_id' })
  destinataire: User;

  @Column()
  destinataire_id: string;

  @ManyToOne(() => Conge, { nullable: true, eager: true })
  @JoinColumn({ name: 'conge_id' })
  conge: Conge;

  @Column({ nullable: true })
  conge_id: string;

  @Column({ type: 'enum', enum: TypeNotification })
  type: TypeNotification;

  @Column()
  message: string;

  @Column({ default: false })
  lu: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
