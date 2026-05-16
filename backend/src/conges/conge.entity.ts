import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum StatutConge {
  EN_ATTENTE = 'en_attente',
  APPROUVE = 'approuve',
  REFUSE = 'refuse',
  ANNULE = 'annule',
}

export enum TypeConge {
  ANNUEL = 'annuel',
  MALADIE = 'maladie',
  EXCEPTIONNEL = 'exceptionnel',
  SANS_SOLDE = 'sans_solde',
}

@Entity('conges')
export class Conge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.conges, { eager: true })
  @JoinColumn({ name: 'demandeur_id' })
  demandeur: User;

  @Column()
  demandeur_id: string;

  @Column({ type: 'date' })
  dateDebut: string;

  @Column({ type: 'date' })
  dateFin: string;

  @Column({ type: 'int' })
  nombreJours: number;

  @Column({ type: 'enum', enum: TypeConge, default: TypeConge.ANNUEL })
  typeConge: TypeConge;

  @Column({ type: 'enum', enum: StatutConge, default: StatutConge.EN_ATTENTE })
  statut: StatutConge;

  @Column({ type: 'text', nullable: true })
  motif: string;

  @Column({ type: 'text', nullable: true })
  remarqueManager: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ nullable: true })
  manager_id: string;

  @Column({ nullable: true })
  dateDecision: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
