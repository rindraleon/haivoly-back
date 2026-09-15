# Haivoly Backend — API NestJS

API REST pour la gestion agricole intelligente (parcelles, cultures, observations, interventions, récoltes). Stack moderne, sécurisée et prête pour la production.

## Stack

- **Framework :** NestJS 11 + TypeScript 5.7
- **ORM :** Prisma 7.9 (PostgreSQL + `@prisma/adapter-pg`)
- **Auth :** Passport + JWT (`@nestjs/jwt` 11, `passport-jwt` 4) + `bcrypt` 6
- **Validation :** `class-validator` + `class-transformer`
- **Tests :** Jest 30 + Supertest + ts-jest
- **Qualité :** ESLint 9 + Prettier 3 + `typescript-eslint`

## Prérequis

- Node.js 20+ (recommandé 20.20 LTS) + npm 10+
- PostgreSQL 14+ (local ou distant)
- (Optionnel) `psql` pour vérifier la connexion

Vérifier :
```bash
node -v   # v20.20.x
npm -v    # 10.8.x
psql --version
```

## Installation

```bash
cd backend
npm install
```

## Configuration — `.env`

Créer `backend/.env` à partir de l'exemple :

```env
# Base PostgreSQL
DATABASE_URL="postgresql://postgres:PgAdmin@localhost:5432/HaiVoly?schema=public"

# JWT
JWT_SECRET="haivoly_jwt_secret_2025_change_me_strong_32chars_min"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=3000
NODE_ENV=development

# Mail (optionnel, dev = log console si absent)
# MAIL_HOST=smtp.example.com
# MAIL_PORT=587
# MAIL_USER=
# MAIL_PASS=
```

> `DATABASE_URL` doit pointer vers une base existante `HaiVoly`. Créer la base si besoin :
> ```bash
> psql -U postgres -c "CREATE DATABASE \"HaiVoly\";"
> ```

## Base de données — Prisma

```bash
# Générer le client Prisma (après npm install ou modif de schema.prisma)
npx prisma generate

# Appliquer les migrations existantes (prod/dev)
npx prisma migrate deploy

# En dev : créer une migration après modif de schema.prisma
npx prisma migrate dev --name init

# Ouvrir le studio Prisma (GUI)
npx prisma studio

# Réinitialiser la base (dev uniquement, destructive)
npx prisma migrate reset
```

**Schéma :** 12 modèles (`Utilisateur`, `PasswordResetToken`, `Parcelle`, `Culture`, `PointGPS`, `PointGPSCulture`, `Intervention`, `PhotoIntervention`, `Observation`, `Photo`, `Recolte`, `PhotoRecolte`, `Action`, `Recommendation`) + 3 enums (`Role`, `StatutParcelle`, `StatutCulture`).

## Développement

```bash
# Lancer en watch (reload auto)
npm run start:dev

# Lancer normal
npm run start

# Lancer en debug (Node --inspect + watch)
npm run start:debug

# Build (compile TypeScript → dist/)
npm run build

# Lancer la version buildée (prod)
npm run start:prod
```

Serveur par défaut : `http://localhost:3000`

**Vérifier** :
```bash
curl http://localhost:3000
# → Hello World!
```

## Qualité

```bash
# Formater (Prettier)
npm run format

# Linter (ESLint + fix)
npm run lint

# Vérification TypeScript (sans émettre)
npx tsc --noEmit
```

> Lint actuel : 505 erreurs `no-unsafe-*` en mode strict — non bloquant, à corriger progressivement (typage Prisma).

## Tests

```bash
# Tests unitaires (Jest)
npm test

# Watch
npm run test:watch

# Coverage
npm run test:cov

# E2E (nécessite config test/jest-e2e.json)
npm run test:e2e

# Debug
npm run test:debug
```

> Après `npm install`, exécuter `npx prisma generate` sinon `Cannot find module '.prisma/client/default'`.

## API — Endpoints principaux

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/auth/register` | non | Créer un compte (nom, prenom, email, password) |
| `POST` | `/auth/login` | non | Connexion (email, password) → JWT |
| `GET` | `/auth/profile` | JWT | Profil utilisateur |
| `POST` | `/auth/forgot-password` | non | Demander un lien de réinitialisation |
| `POST` | `/auth/reset-password` | non | Réinitialiser le mot de passe (token) |
| `GET` | `/dashboard` | JWT | Stats agrégées |
| `GET/POST` | `/parcelles` | JWT | Lister / créer une parcelle |
| `GET/PATCH/DELETE` | `/parcelles/:id` | JWT | Détail / modifier / supprimer |
| `GET/POST` | `/parcelles/:parcelleId/cultures` | JWT | Lister / créer une culture |
| `GET/DELETE` | `/parcelles/:parcelleId/cultures/:id` | JWT | Détail / supprimer culture (+ points-gps) |
| `GET/POST` | `/parcelles/:parcelleId/cultures/:cultureId/interventions` | JWT | Interventions |
| `GET/POST` | `/parcelles/.../observations` | JWT | Observations |
| `GET/POST` | `/recoltes` | JWT | Récoltes |
| `POST` | `/actions` , `/actions/batch-sync` | JWT | Sync offline (Action) |
| `GET` | `/recommendations` | JWT | Recommandations |

Tous les DTOs sont validés par `class-validator`.

## Déploiement

```bash
npm run build
# Puis avec PM2, Docker ou Nest Mau :
npm install -g @nestjs/mau
mau deploy
```

Voir [Nest deployment docs](https://docs.nestjs.com/deployment).

## Dépannage

- **Prisma : `Can't reach database`** → vérifier `DATABASE_URL` et que PostgreSQL tourne (`pg_isready`)
- **`JWT_SECRET` manquant** → définir dans `.env` (32+ caractères)
- **`EADDRINUSE 3000`** → `PORT=3001` ou `lsof -i :3000 && kill -9 <pid>`
- **Tests échouent `Cannot find module '.prisma/client'`** → `npx prisma generate`

## Licence

MIT — NestJS
