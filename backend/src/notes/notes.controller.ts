import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../users/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsInt, IsString, Min, Max } from 'class-validator';

class UpsertRendementDto {
  @IsString() agent_id: string;
  @IsInt() @Min(2020) annee: number;
  @IsInt() @Min(1) @Max(4) trimestre: number;
  @IsNumber() @Min(0) @Max(100) note: number;
}

class UpsertProductiviteDto {
  @IsString() agent_id: string;
  @IsInt() @Min(2020) annee: number;
  @IsNumber() @Min(0) @Max(100) note: number;
}

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CHEF_EXPLOITATION, Role.SUPER_ADMIN)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('agent/:id')
  getForAgent(@Param('id') id: string) {
    return this.notesService.getForAgent(id);
  }

  @Post('rendement')
  upsertRendement(@Request() req, @Body() dto: UpsertRendementDto) {
    return this.notesService.upsertRendement({ ...dto, manager_id: req.user.userId });
  }

  @Post('productivite')
  upsertProductivite(@Request() req, @Body() dto: UpsertProductiviteDto) {
    return this.notesService.upsertProductivite({ ...dto, manager_id: req.user.userId });
  }
}
