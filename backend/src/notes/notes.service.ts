import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteRendement, NoteProductivite } from './note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteRendement)   private rendRepo: Repository<NoteRendement>,
    @InjectRepository(NoteProductivite) private prodRepo: Repository<NoteProductivite>,
  ) {}

  async getForAgent(agentId: string) {
    const rendement    = await this.rendRepo.find({ where: { agent_id: agentId }, order: { annee: 'DESC', trimestre: 'ASC' } });
    const productivite = await this.prodRepo.find({ where: { agent_id: agentId }, order: { annee: 'DESC' } });
    return { rendement, productivite };
  }

  async upsertRendement(dto: { agent_id: string; manager_id: string; annee: number; trimestre: number; note: number }) {
    const existing = await this.rendRepo.findOne({ where: { agent_id: dto.agent_id, annee: dto.annee, trimestre: dto.trimestre } });
    if (existing) {
      existing.note       = dto.note;
      existing.manager_id = dto.manager_id;
      return this.rendRepo.save(existing);
    }
    return this.rendRepo.save(this.rendRepo.create(dto));
  }

  async upsertProductivite(dto: { agent_id: string; manager_id: string; annee: number; note: number }) {
    const existing = await this.prodRepo.findOne({ where: { agent_id: dto.agent_id, annee: dto.annee } });
    if (existing) {
      existing.note       = dto.note;
      existing.manager_id = dto.manager_id;
      return this.prodRepo.save(existing);
    }
    return this.prodRepo.save(this.prodRepo.create(dto));
  }
}
