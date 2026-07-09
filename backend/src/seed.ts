import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role, Equipe } from './users/user.entity';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const existing = await userRepo.findOne({ where: { email: 'admin@gesconge.dz' } });
  if (!existing) {
    const hash = await bcrypt.hash('Admin@2024', 10);
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
    console.log('✅ Super admin créé: matricule ADMIN001 / Admin@2024');
  } else {
    console.log('ℹ️  Super admin existe déjà');
  }

  // Create sample chef exploitation
  const chef = await userRepo.findOne({ where: { email: 'chef@gesconge.dz' } });
  if (!chef) {
    const hash = await bcrypt.hash('Chef@2024', 10);
    await userRepo.save(userRepo.create({
      email: 'chef@gesconge.dz',
      matricule: 'CHEF001',
      password: hash,
      nom: 'Exploitation',
      prenom: 'Chef',
      role: Role.CHEF_EXPLOITATION,
      equipe: Equipe.NONE,
      soldeConge: 30,
      soldeInitial: 30,
      actif: true,
    }));
    console.log('✅ Chef exploitation créé: matricule CHEF001 / Chef@2024');
  }

  // Sample agents for each team
  const agents = [
    { email: 'quart.a@gesconge.dz', matricule: 'QA001', prenom: 'Ali', nom: 'Benali', role: Role.CHEF_QUART, equipe: Equipe.A },
    { email: 'quart.b@gesconge.dz', matricule: 'QB001', prenom: 'Omar', nom: 'Khelil', role: Role.CHEF_QUART, equipe: Equipe.B },
    { email: 'bloc.a@gesconge.dz', matricule: 'BA001', prenom: 'Fatima', nom: 'Meziane', role: Role.CHEF_BLOC, equipe: Equipe.A },
    { email: 'op.a@gesconge.dz', matricule: 'OA001', prenom: 'Karim', nom: 'Saidi', role: Role.OPERATEUR, equipe: Equipe.A },
    { email: 'op.c@gesconge.dz', matricule: 'OC001', prenom: 'Leila', nom: 'Mansouri', role: Role.OPERATEUR, equipe: Equipe.C },
  ];

  for (const a of agents) {
    const exists = await userRepo.findOne({ where: { email: a.email } });
    if (!exists) {
      const hash = await bcrypt.hash('Agent@2024', 10);
      await userRepo.save(userRepo.create({
        ...a,
        password: hash,
        soldeConge: 18,
        soldeInitial: 18,
        actif: true,
      }));
      console.log(`✅ Agent créé: matricule ${a.matricule} / Agent@2024`);
    }
  }

  await app.close();
  console.log('\n🎉 Seed terminé avec succès!');
}

seed().catch(console.error);
