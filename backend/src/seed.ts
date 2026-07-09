import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role, Equipe } from './users/user.entity';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const existing = await userRepo.findOne({ where: { matricule: 'ADMIN001' } });
  if (!existing) {
    const hash = await bcrypt.hash('123456', 10);
    await userRepo.save(userRepo.create({
      email: 'admin@gesconge.dz',
      matricule: 'ADMIN001',
      password: hash,
      nom: 'Administrateur',
      prenom: 'Super',
      role: Role.SUPER_ADMIN,
      equipe: Equipe.NONE,
      soldeConge: 0,
      soldeInitial: 0,
      actif: true,
    }));
    console.log('✅ Super admin créé: matricule ADMIN001 / 123456');
  } else {
    console.log('ℹ️  Super admin existe déjà');
  }

  await app.close();
  console.log('\n🎉 Seed terminé avec succès!');
}

seed().catch(console.error);
