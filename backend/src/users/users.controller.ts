import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role, Equipe } from './user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, IsNotEmpty, IsNumber, Min, MinLength } from 'class-validator';

class UpdateMyProfileDto {
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() unite?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
}

class CreateUserDto {
  @IsEmail() email: string;
  @IsString() password: string;
  @IsString() nom: string;
  @IsString() prenom: string;
  @IsEnum(Role) role: Role;
  @IsEnum(Equipe) equipe: Equipe;
  @IsOptional() @IsString() telephone?: string;
  @IsString() @IsNotEmpty() matricule: string;
  @IsOptional() @IsString() unite?: string;
  @IsOptional() @IsNumber() soldeConge?: number;
  @IsOptional() @IsNumber() soldeInitial?: number;
}

class UpdateUserDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() prenom?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsEnum(Equipe) equipe?: Equipe;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() @IsNotEmpty() matricule?: string;
  @IsOptional() @IsString() unite?: string;
}

class UpdateSoldeDto {
  @IsNumber() @Min(0) solde: number;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.CHEF_EXPLOITATION)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Put('me/profile')
  updateMyProfile(@Request() req, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMyProfile(req.user.userId, dto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.CHEF_EXPLOITATION)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Put(':id/solde')
  @Roles(Role.SUPER_ADMIN)
  setSolde(@Param('id') id: string, @Body() dto: UpdateSoldeDto) {
    return this.usersService.setSoldeInitial(id, dto.solde);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  deactivate(@Request() req, @Param('id') id: string) {
    if (id === req.user.userId) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte');
    }
    return this.usersService.deactivate(id);
  }

  @Put(':id/reactiver')
  @Roles(Role.SUPER_ADMIN)
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }

  @Delete(':id/supprimer')
  @Roles(Role.SUPER_ADMIN)
  deleteForever(@Request() req, @Param('id') id: string) {
    if (id === req.user.userId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }
    return this.usersService.deleteForever(id);
  }
}
