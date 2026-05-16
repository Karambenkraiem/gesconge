import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Conge } from '../conges/conge.entity';
import { Notification } from '../notifications/notification.entity';

export enum Role {
  SUPER_ADMIN = 'super_admin',
  CHEF_EXPLOITATION = 'chef_exploitation',
  CHEF_QUART = 'chef_quart',
  CHEF_BLOC = 'chef_bloc',
  OPERATEUR = 'operateur',
  AUTRE = 'autre',
}

export enum Equipe {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  NONE = 'NONE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ type: 'enum', enum: Role, default: Role.OPERATEUR })
  role: Role;

  @Column({ type: 'enum', enum: Equipe, default: Equipe.NONE })
  equipe: Equipe;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  soldeConge: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  soldeInitial: number;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  matricule: string;

  @Column({ nullable: true })
  unite: string;

  @Column({ default: true })
  actif: boolean;

  @Column({ nullable: true })
  lastMonthlyAdd: Date;

  @OneToMany(() => Conge, (conge) => conge.demandeur)
  conges: Conge[];

  @OneToMany(() => Notification, (notif) => notif.destinataire)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
