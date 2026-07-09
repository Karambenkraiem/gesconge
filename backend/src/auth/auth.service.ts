import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role, Equipe } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(matricule: string, password: string) {
    const user = await this.userRepo.findOne({ where: { matricule, actif: true } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Matricule ou mot de passe incorrect');
    }
    const payload = { sub: user.id, matricule: user.matricule, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: this.sanitizeUser(user),
    };
  }

  async register(dto: {
    email: string; password: string; nom: string; prenom: string;
    role: Role; equipe: Equipe; telephone?: string; matricule: string;
  }) {
    const emailExists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException('Email déjà utilisé');
    const matriculeExists = await this.userRepo.findOne({ where: { matricule: dto.matricule } });
    if (matriculeExists) throw new ConflictException('Matricule déjà utilisé');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hashed });
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  sanitizeUser(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
