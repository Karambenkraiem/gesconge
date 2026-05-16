import {
  Controller, Get, Post, Put, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { CongesService } from './conges.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../users/user.entity';
import { StatutConge, TypeConge } from './conge.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

class CreateCongeDto {
  @IsDateString() dateDebut: string;
  @IsDateString() dateFin: string;
  @IsEnum(TypeConge) typeConge: TypeConge;
  @IsOptional() @IsString() motif?: string;
}

class DeciderDto {
  @IsEnum([StatutConge.APPROUVE, StatutConge.REFUSE]) statut: StatutConge.APPROUVE | StatutConge.REFUSE;
  @IsOptional() @IsString() remarque?: string;
}

@ApiTags('Congés')
@ApiBearerAuth()
@Controller('conges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CongesController {
  constructor(private congesService: CongesService) {}

  @Get()
  findAll(@Request() req) {
    return this.congesService.findAll(req.user);
  }

  @Get('mes-conges')
  findMine(@Request() req) {
    return this.congesService.findMyConges(req.user.userId);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.CHEF_EXPLOITATION)
  getStats() {
    return this.congesService.getStats();
  }

  @Post()
  create(@Request() req, @Body() dto: CreateCongeDto) {
    return this.congesService.create(req.user.userId, dto);
  }

  @Put(':id/decider')
  @Roles(Role.CHEF_EXPLOITATION, Role.SUPER_ADMIN)
  decider(@Param('id') id: string, @Request() req, @Body() dto: DeciderDto) {
    return this.congesService.decider(id, req.user.userId, dto);
  }

  @Put(':id/annuler')
  annuler(@Param('id') id: string, @Request() req) {
    return this.congesService.annuler(id, req.user.userId);
  }
}
