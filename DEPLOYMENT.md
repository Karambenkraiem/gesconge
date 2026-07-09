# Déploiement — gesconge.alkaramsoft.ovh

Ce VPS héberge déjà 3 projets (dataserv, gtpp, amsr) derrière un seul conteneur
`dataserv-nginx` qui fait reverse-proxy vers chaque projet via le réseau Docker
externe `proxy_net`. Ce guide ajoute GesConge **sans redémarrer ni reconstruire
aucun des conteneurs existants**.

Fichiers concernés dans ce repo :
- `docker-compose.prod.yml` — services `postgres` / `backend` / `frontend`, aucun port publié sur l'hôte
- `.env.prod.example` — variables à copier/remplir sur le VPS
- `deploy/nginx-gesconge.conf` — snippet à coller dans le nginx.conf partagé
- `.github/workflows/deploy.yml` — pipeline CI/CD (build + déploiement SSH)

---

## 0. Prérequis

- DNS : ajouter un enregistrement `A gesconge.alkaramsoft.ovh` pointant vers l'IP du VPS (même IP que `alkaramsoft.ovh`).
- Accès SSH au VPS avec l'utilisateur `debian` (déjà dans le groupe `docker`, vu dans le `docker ps` fourni).

---

## 1. Cloner le projet sur le VPS

```bash
sudo mkdir -p /opt/steg/gesconge && sudo chown debian:debian /opt/steg/gesconge
git clone https://github.com/Karambenkraiem/gesconge.git /opt/steg/gesconge
cd /opt/steg/gesconge
```

> Le nom du dossier (`gesconge`) détermine le préfixe des images Docker
> (`gesconge-backend`, `gesconge-frontend`) — il ne doit pas entrer en
> collision avec `gtpp`, `amsr` ou `projdataservcomplet`. C'est déjà le cas.

## 2. Configurer les variables d'environnement

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Renseigner `DB_PASSWORD` et `JWT_SECRET` avec des valeurs fortes (`openssl rand -base64 48`).
Laisser `FRONTEND_URL` et `NEXT_PUBLIC_API_URL` tels quels (déjà pointés sur le futur sous-domaine).

## 3. Construire et démarrer les conteneurs

Le réseau externe `proxy_net` existe déjà sur ce VPS (vu dans `docker network ls`) — pas besoin de le créer.

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker ps --filter "name=gesconge"
```

Les 3 conteneurs (`gesconge_postgres_prod`, `gesconge_backend_prod`,
`gesconge_frontend_prod`) doivent être `Up`, sans port publié — c'est normal,
ils seront joints par nginx via `proxy_net`.

## 4. Seed initial (comptes de démo + données de test)

```bash
docker exec gesconge_backend_prod node dist/seed
```

## 5. Nginx — étape 1 : bloc HTTP (avant certificat)

**Sauvegarder d'abord le fichier partagé** (il sert aussi dataserv/gtpp/amsr — une erreur ici impacterait les 3) :

```bash
sudo cp /opt/dataserv/ProjDataservComplet/nginx/nginx.conf /opt/dataserv/ProjDataservComplet/nginx/nginx.conf.bak-$(date +%Y%m%d)
```

Ouvrir le fichier et coller **uniquement le premier bloc** (`# ── GesConge — HTTP → HTTPS redirect ──`)
de `deploy/nginx-gesconge.conf`, juste avant la dernière accolade fermante `}` du fichier :

```bash
sudo nano /opt/dataserv/ProjDataservComplet/nginx/nginx.conf
```

Tester puis recharger (ne recharge que si le test passe — sinon nginx garde l'ancienne config active) :

```bash
docker exec dataserv-nginx nginx -t
docker exec dataserv-nginx nginx -s reload
```

## 6. Obtenir le certificat SSL

```bash
sudo certbot certonly --webroot -w /etc/letsencrypt/webroot -d gesconge.alkaramsoft.ovh
```

(Même méthode que pour gtpp/amsr — adapter si votre certbot tourne différemment sur ce VPS.)

## 7. Nginx — étape 2 : bloc HTTPS

Coller maintenant le second bloc (`# ── GesConge — HTTPS ──`) de `deploy/nginx-gesconge.conf`,
également avant la dernière `}` :

```bash
sudo nano /opt/dataserv/ProjDataservComplet/nginx/nginx.conf
docker exec dataserv-nginx nginx -t
docker exec dataserv-nginx nginx -s reload
```

## 8. Vérifier

```bash
curl -I https://gesconge.alkaramsoft.ovh
curl -I https://gtpp.alkaramsoft.ovh   # confirmer que les autres sites tournent toujours
curl -I https://amsr.alkaramsoft.ovh
```

---

## 9. Activer le pipeline CI/CD

Dans GitHub → Settings → Secrets and variables → Actions, ajouter :

| Secret         | Valeur                                              |
|----------------|------------------------------------------------------|
| `VPS_HOST`     | IP ou hostname du VPS                                 |
| `VPS_USER`     | `debian`                                              |
| `VPS_SSH_KEY`  | clé privée SSH (dédiée, dont la clé publique est ajoutée à `~/.ssh/authorized_keys` sur le VPS) |
| `VPS_PORT`     | port SSH (optionnel, 22 par défaut)                   |

À chaque push sur `main` : le job `build` compile backend + frontend (échoue vite en cas d'erreur),
puis le job `deploy` se connecte en SSH, fait `git pull`, reconstruit **uniquement** `backend` et
`frontend` (`postgres` n'est jamais recréé) et nettoie les images orphelines.

---

## Rollback rapide

```bash
# revenir à une image précédente si besoin
cd /opt/steg/gesconge && git log --oneline -5
git checkout <commit-precedent>
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build backend frontend

# restaurer nginx si un bloc a cassé la config partagée
sudo cp /opt/dataserv/ProjDataservComplet/nginx/nginx.conf.bak-YYYYMMDD /opt/dataserv/ProjDataservComplet/nginx/nginx.conf
docker exec dataserv-nginx nginx -s reload
```
