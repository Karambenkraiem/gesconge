# GesConge — Système de Gestion des Congés

Application web/mobile complète pour la gestion des congés des équipes de quart (A, B, C, D).

---

## 🏗️ Architecture

```
conge-app/
├── backend/          ← NestJS + TypeORM + PostgreSQL (port 3001)
├── frontend/         ← Next.js 14 + Tailwind CSS (port 3000)
└── docker-compose.yml
```

## 👥 Rôles utilisateurs

| Rôle              | Accès                                         |
|-------------------|-----------------------------------------------|
| Super Admin       | Tout : gestion agents, soldes, congés         |
| Chef Exploitation | Approuver/refuser congés, voir tous           |
| Chef de Quart     | Demander congés, voir calendrier              |
| Chef de Bloc      | Demander congés, voir calendrier              |
| Opérateur         | Demander congés, voir calendrier              |
| Autre             | Demander congés, voir calendrier              |

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- PostgreSQL 14+ (ou Docker)
- npm ou yarn

---

### Option 1 — Docker Compose (recommandé)

```bash
cd conge-app
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Lancer tout en un
docker-compose up -d

# Seed (premier démarrage)
docker exec conge_backend node dist/seed
```

Accès : http://localhost:3000

---

### Option 2 — Installation manuelle

#### 1. Base de données PostgreSQL

```sql
CREATE DATABASE conge_db;
CREATE USER conge_user WITH PASSWORD 'CongeSecure@2024';
GRANT ALL PRIVILEGES ON DATABASE conge_db TO conge_user;
```

#### 2. Backend (NestJS)

```bash
cd backend
cp .env.example .env
# Éditez .env avec vos identifiants DB

npm install
npm run start:dev
# API disponible sur http://localhost:3001
# Docs Swagger : http://localhost:3001/api-docs
```

#### Seed initial (créer super admin + données de test)

```bash
npm run seed
```

Comptes créés :
| Email                  | Mot de passe | Rôle               |
|------------------------|--------------|--------------------|
| admin@gesconge.dz      | Admin@2024   | Super Admin        |
| chef@gesconge.dz       | Chef@2024    | Chef Exploitation  |
| quart.a@gesconge.dz    | Agent@2024   | Chef de Quart Éq.A |
| op.a@gesconge.dz       | Agent@2024   | Opérateur Éq.A     |

#### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev
# App disponible sur http://localhost:3000
```

---

## 📱 Conversion en APK Android

### Méthode 1 : Capacitor (recommandée — apk natif)

```bash
cd frontend

# 1. Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar

# 2. Modifier next.config.js pour export statique
# Ajoutez : output: 'export', images: { unoptimized: true }

# IMPORTANT: Configurez l'URL de votre backend dans capacitor.config.ts
# server.url = 'https://votre-backend.domaine.com'

# 3. Builder le frontend
npm run build

# 4. Initialiser Capacitor (première fois)
npx cap init GesConge dz.gesconge.app --web-dir out

# 5. Ajouter Android
npx cap add android

# 6. Synchroniser
npx cap sync android

# 7. Ouvrir Android Studio
npx cap open android

# Dans Android Studio :
# Build > Generate Signed Bundle/APK > APK
# Suivez l'assistant pour créer/sélectionner votre keystore
```

### Méthode 2 : PWA (plus simple — installer depuis le navigateur)

L'application est déjà configurée comme PWA (manifest.json inclus).

1. Déployez le frontend sur un serveur HTTPS
2. Ouvrez l'URL dans Chrome Android
3. Chrome proposera "Ajouter à l'écran d'accueil"
4. L'app s'installe comme une application native

### Méthode 3 : WebView APK simple

```bash
# Créer un projet Android minimal avec WebView
# Pointant vers votre URL déployée
# (Voir template dans /android-webview-template/)
```

---

## ⚙️ Fonctionnalités

### Gestion des congés
- ✅ Demande de congé (annuel, maladie, exceptionnel, sans solde)
- ✅ Calcul automatique du nombre de jours
- ✅ Vérification du solde avant soumission
- ✅ Approbation/Refus par le Chef Exploitation
- ✅ Possibilité d'écrire une remarque à chaque décision

### Soldes
- ✅ Solde initial défini par le Super Admin
- ✅ **+2 jours automatiques chaque 1er du mois** (CRON)
- ✅ Déduction automatique à l'approbation du congé annuel
- ✅ Gestion manuelle des soldes par le Super Admin

### Notifications
- ✅ Notification au Chef Exploitation à chaque nouvelle demande
- ✅ Notification à l'agent lors de l'approbation/refus
- ✅ Badge de compteur non-lus en temps réel (polling 30s)
- ✅ Clic sur notification → redirige vers la demande

### Calendrier
- ✅ Calendrier interactif avec tous les congés
- ✅ Code couleur : 🟡 En attente / 🟢 Approuvé / 🔴 Refusé / ⚫ Annulé
- ✅ Clic sur une date → liste des congés ce jour-là

### Administration (Super Admin)
- ✅ Créer/modifier/désactiver des agents
- ✅ Définir le solde initial de chaque agent
- ✅ Gérer les soldes manuellement
- ✅ Voir tous les agents et leurs soldes

---

## 🔒 Sécurité

- JWT avec expiration 7 jours
- Hachage bcrypt des mots de passe (salt 10)
- Guards NestJS par rôle sur chaque endpoint
- CORS configuré
- Validation des DTOs avec class-validator

---

## 📡 API Endpoints principaux

```
POST   /auth/login              Connexion
POST   /auth/register           Inscription (admin only en prod)
GET    /auth/profile            Profil connecté

GET    /users                   Liste agents (admin/chef)
POST   /users                   Créer agent (super admin)
PUT    /users/:id               Modifier agent
PUT    /users/:id/solde         Définir solde (super admin)

GET    /conges                  Tous les congés
GET    /conges/mes-conges       Mes congés
POST   /conges                  Nouvelle demande
PUT    /conges/:id/decider      Approuver/Refuser (chef expl)
PUT    /conges/:id/annuler      Annuler (propriétaire)

GET    /notifications           Mes notifications
GET    /notifications/unread-count  Nb non-lus
PUT    /notifications/:id/lu    Marquer lu
PUT    /notifications/tout-lire Marquer tout lu
```

---

## 🌐 Déploiement production

### Backend
```bash
# Build
npm run build

# Variables d'env requises
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET  # Minimum 32 caractères aléatoires
FRONTEND_URL  # URL du frontend pour CORS
```

### Frontend
```bash
# Build avec URL API
NEXT_PUBLIC_API_URL=https://api.votredomaine.com npm run build

# Démarrer
npm start
```

### Nginx reverse proxy (exemple)
```nginx
server {
    listen 443 ssl;
    server_name gesconge.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
    }
}
```

---

## 📦 Technologies

| Couche     | Technologie                              |
|------------|------------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS     |
| Backend    | NestJS 10, TypeScript, Passport JWT      |
| Base de données | PostgreSQL 16, TypeORM              |
| Auth       | JWT (7j), bcryptjs                       |
| Mobile     | Capacitor (Android APK) ou PWA           |
| Déploiement | Docker Compose, Nginx                   |

---

## 📞 Support

Pour toute question sur l'installation ou la configuration, consultez la documentation Swagger disponible à `/api-docs` sur le backend.
