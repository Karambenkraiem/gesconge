import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('app_settings')
export class AppSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  demoMode: boolean;
}
