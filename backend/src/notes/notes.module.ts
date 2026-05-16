import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteRendement, NoteProductivite } from './note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NoteRendement, NoteProductivite])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
