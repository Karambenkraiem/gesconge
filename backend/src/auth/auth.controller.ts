import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { Role, Equipe } from '../users/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() nom: string;
  @IsString() prenom: string;
  @IsEnum(Role) role: Role;
  @IsEnum(Equipe) equipe: Equipe;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() matricule?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
