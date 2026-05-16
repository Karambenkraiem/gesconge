import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notes_rendement')
export class NoteRendement {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() agent_id: string;
  @Column() manager_id: string;
  @Column({ type: 'int' }) annee: number;
  @Column({ type: 'int' }) trimestre: number; // 1-4
  @Column({ type: 'decimal', precision: 5, scale: 2 }) note: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('notes_productivite')
export class NoteProductivite {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() agent_id: string;
  @Column() manager_id: string;
  @Column({ type: 'int' }) annee: number;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) note: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
