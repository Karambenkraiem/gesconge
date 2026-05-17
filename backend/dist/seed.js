"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./users/user.entity");
const bcrypt = require("bcryptjs");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const existing = await userRepo.findOne({ where: { email: 'admin@gesconge.dz' } });
    if (!existing) {
        const hash = await bcrypt.hash('Admin@2024', 10);
        await userRepo.save(userRepo.create({
            email: 'admin@gesconge.dz',
            password: hash,
            nom: 'Administrateur',
            prenom: 'Super',
            role: user_entity_1.Role.SUPER_ADMIN,
            equipe: user_entity_1.Equipe.NONE,
            soldeConge: 0,
            soldeInitial: 0,
            actif: true,
        }));
        console.log('✅ Super admin créé: admin@gesconge.dz / Admin@2024');
    }
    else {
        console.log('ℹ️  Super admin existe déjà');
    }
    const chef = await userRepo.findOne({ where: { email: 'chef@gesconge.dz' } });
    if (!chef) {
        const hash = await bcrypt.hash('Chef@2024', 10);
        await userRepo.save(userRepo.create({
            email: 'chef@gesconge.dz',
            password: hash,
            nom: 'Exploitation',
            prenom: 'Chef',
            role: user_entity_1.Role.CHEF_EXPLOITATION,
            equipe: user_entity_1.Equipe.NONE,
            soldeConge: 30,
            soldeInitial: 30,
            actif: true,
        }));
        console.log('✅ Chef exploitation créé: chef@gesconge.dz / Chef@2024');
    }
    const agents = [
        { email: 'quart.a@gesconge.dz', prenom: 'Ali', nom: 'Benali', role: user_entity_1.Role.CHEF_QUART, equipe: user_entity_1.Equipe.A },
        { email: 'quart.b@gesconge.dz', prenom: 'Omar', nom: 'Khelil', role: user_entity_1.Role.CHEF_QUART, equipe: user_entity_1.Equipe.B },
        { email: 'bloc.a@gesconge.dz', prenom: 'Fatima', nom: 'Meziane', role: user_entity_1.Role.CHEF_BLOC, equipe: user_entity_1.Equipe.A },
        { email: 'op.a@gesconge.dz', prenom: 'Karim', nom: 'Saidi', role: user_entity_1.Role.OPERATEUR, equipe: user_entity_1.Equipe.A },
        { email: 'op.c@gesconge.dz', prenom: 'Leila', nom: 'Mansouri', role: user_entity_1.Role.OPERATEUR, equipe: user_entity_1.Equipe.C },
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
            console.log(`✅ Agent créé: ${a.email} / Agent@2024`);
        }
    }
    await app.close();
    console.log('\n🎉 Seed terminé avec succès!');
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map