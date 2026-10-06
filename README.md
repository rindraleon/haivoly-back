# Haivoly — API (NestJS + TypeORM + PostgreSQL)

API REST de la plateforme agricole **Haivoly** : parcelles, cultures,
interventions, observations, récoltes, recommandations et synchronisation
hors-ligne.

> ⚠️ **Prisma a été entièrement retiré du projet.** L'accès aux données passe
> exclusivement par **TypeORM** (repositories, `QueryBuilder`, transactions).
> Le schéma PostgreSQL historique est conservé à l'identique (mêmes tables, mêmes
> colonnes, mêmes contraintes) : aucune donnée n'est perdue.

---

## 1. Stack

| Élément        | Version / choix                                       |
| -------------- | ----------------------------------------------------- |
| Runtime        | Node.js 20                                            |
| Framework      | NestJS 11                                             |
| ORM            | TypeORM 0.3 (`pg` 8.22)                               |
| Base de données| PostgreSQL 17                                         |
| Auth           | JWT (`@nestjs/jwt`) + bcrypt                          |
| Validation     | `class-validator` / `class-transformer`, pipe global  |
| Tests          | Jest (unitaires) + Supertest (e2e)                    |

---

## 2. Démarrage

```bash
npm install
cp .env.example .env          # renseigner DATABASE_URL et JWT_SECRET
npm run migration:run         # applique les migrations (non destructives)
npm run start:dev             # http://localhost:3000
```

Vérification rapide :

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok","database":"up",...}}
```

### Scripts

| Script                     | Rôle                                            |
| -------------------------- | ----------------------------------------------- |
| `npm run start:dev`        | Démarrage en mode développement (watch)         |
| `npm run build`            | Compilation TypeScript → `dist/`                |
| `npm run start:prod`       | Exécution du build (`node dist/main`)           |
| `npm run lint`             | ESLint (+ Prettier)                             |
| `npm test`                 | Tests unitaires                                 |
| `npm run test:e2e`         | Tests d'intégration (base réelle)               |
| `npm run migration:run`    | Applique les migrations en attente              |
| `npm run migration:show`   | Liste les migrations appliquées / en attente     |
| `npm run migration:revert` | Annule la dernière migration                     |
| `npm run migration:generate -- src/database/migrations/Nom` | Génère une migration |
| `bash scripts/qa-contrat-erreurs.sh` | 22 vérifications du contrat d'erreurs et des uploads |

---

## 3. Migrations — aucune destruction de données

Les migrations vivent dans `src/database/migrations/` :

| Migration                          | Contenu                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `1730000000000-InitialSchema`      | Schéma de référence, **idempotent** (`IF NOT EXISTS`), `down()` vide  |
| `1730000001000-InterventionStatut` | Ajoute `Intervention.statut` (enum) + index                          |
| `1755000200000-DateOnlyColumns`    | Convertit les colonnes calendaires en type `date` (voir §5)          |

Règles appliquées :

* `synchronize` est **toujours** `false` (aucune synchronisation automatique) ;
* les migrations sont **idempotentes** : rejouables sans effet de bord ;
* aucune table n'est supprimée, aucun identifiant n'est modifié ;
* `down()` ne détruit jamais de donnée métier.

L'historique des migrations Prisma est conservé à titre d'audit dans
`db/legacy-prisma-migrations/` (plus jamais exécuté).

---

## 4. Structure

```
src/
├── auth/            # inscription, connexion, JWT, mot de passe oublié
├── users/           # profil (GET/PATCH /users/me)
├── parcelles/       # CRUD, délimitation GPS, suppression logique
├── points-gps/      # sommets du polygone d'une parcelle
├── cultures/        # CRUD, cycle de vie, délimitation, points GPS
├── interventions/   # CRUD + statut calculé par le serveur
├── observations/    # CRUD + photos
├── recoltes/        # création transactionnelle (culture → RECOLTEE)
├── photos*/         # observation, intervention, récolte
├── recommendations/ # conseils personnalisés / diffusés
├── actions/         # journal des actions (clé d'idempotence de la sync)
├── synchronization/ # POST /sync (idempotent, par lots)
├── dashboard/       # indicateurs agrégés
├── health/          # /health (état de la base)
├── common/          # filtres, intercepteurs, guards, DTO, utilitaires
│   ├── errors/      # catalogue de codes + ApiException
│   └── validation/  # indexation des champs fautifs + messages français
├── config/          # configuration applicative
├── app.setup.ts     # configuration unique de l'application (voir §7.1)
└── database/        # data-source, parsers de types, migrations
```

---

## 5. Contrat de dates (bug corrigé)

Le contrat est désormais **explicite et unique** :

| Cas                          | Format API          | Colonne PostgreSQL |
| ---------------------------- | ------------------- | ------------------ |
| Date sans heure (calendaire) | `YYYY-MM-DD`        | `date`             |
| Instant / horodatage         | ISO-8601 UTC (`…Z`) | `timestamp(3)`     |

Corrections apportées :

1. **Parsers `pg` normalisés** (`src/database/pg-types.ts`) : les colonnes
   `timestamp without time zone` sont lues en **UTC** (et non en heure locale) et
   les colonnes `date` sont renvoyées sous forme de chaîne `YYYY-MM-DD`. C'est ce
   qui supprimait le décalage d'un jour et les `Invalid Date` côté mobile.
2. **Colonnes calendaires converties en `date`** : `Culture.datePlantation`,
   `Culture.datePrevueRecolte`, `Recolte.dateRecolte` (migration
   `1755000200000-DateOnlyColumns`, `USING (… AT TIME ZONE 'UTC')`).
3. **Sérialisation centralisée** dans `TransformResponseInterceptor` : plus aucune
   conversion ad hoc dans les contrôleurs.

---

## 6. Règles métier (source de vérité : le serveur)

| Règle                             | Comportement                                                          |
| --------------------------------- | --------------------------------------------------------------------- |
| Statut d'intervention             | Date future → `PLANIFIEE` ; date ≤ maintenant → `EN_COURS` ; `TERMINEE` jamais écrasé. Le client ne l'envoie jamais. |
| Récolte                           | Création **transactionnelle** : la culture passe en `RECOLTEE`, une seule récolte par culture (index unique), `dateRecolte ≥ datePlantation`. En cas d'échec : rollback. |
| Cycle de vie culture              | `PLANIFIEE → {EN_COURS, ABANDONNEE, SUPPRIMEE}` ; `EN_COURS → RECOLTEE` ; `RECOLTEE` terminal ; `ABANDONNEE → {PLANIFIEE, SUPPRIMEE}`. |
| Statut de culture « à jour »      | **Réconcilié par le serveur** (`common/utils/culture-statut.util.ts`) : une culture `PLANIFIEE` dont la `datePlantation` est atteinte (ou absente) devient `EN_COURS` — à la création, à chaque lecture (détail et listes, en une seule requête) et avant le contrôle de récolte. `RECOLTEE`/`ABANDONNEE`/`SUPPRIMEE` ne sont jamais touchés. |
| Parcelle                          | Transitions `ACTIVE/ABANDONNEE/ARCHIVEE` ; suppression **logique** (`SUPPRIMEE` + motif obligatoire). |
| Superficie / centroïde            | Toujours recalculés côté serveur à partir du polygone (≥ 3 sommets).  |
| Propriété                         | Chaque lecture/écriture est filtrée par `utilisateurId` ; un accès étranger renvoie **404** (jamais 403, pour ne rien divulguer). |
| Synchronisation                   | `POST /sync` idempotent par `clientId` : `SYNCED`, `DUPLICATE`, `FAILED`, `INVALID`, `CONFLICT`. Vocabulaire accepté : `actionType ∈ {CREATE, UPDATE, DELETE}` et `entityType ∈ {PARCELLE, POINT_GPS, CULTURE, INTERVENTION, OBSERVATION, PHOTO, RECOLTE}` — toute autre valeur est refusée en 400. Aucun écrasement silencieux. |

---

### Réconciliation du statut de culture (`statutCultureAJour`)

Une culture **`PLANIFIEE`** dont la date de plantation est atteinte devient
`EN_COURS`, sans intervention manuelle : la règle est appliquée à la création, à
la lecture (parcelle, culture, liste) et **avant de valider une récolte** — ce qui
corrige le 400 « Seule une culture en cours peut être récoltée ». Les autres
statuts ne bougent jamais tout seuls : `RECOLTEE` est posé par la récolte,
`ABANDONNEE`/`SUPPRIMEE` sont explicites.

### Statut d'intervention

`PLANIFIEE` si la date est dans le futur, `EN_COURS` sinon — recalculé à chaque
écriture **et** à chaque lecture. Aucun statut d'intervention n'est accepté du
client.

---

## 7. Format des réponses

```jsonc
// Succès
{ "success": true, "data": { … }, "message": "Opération réussie" }

// Erreur
{
  "success": false,
  "message": "Cette culture possède déjà une récolte",
  "code": "RESOURCE_CONFLICT",          // code stable : c'est LUI que le client interprète
  "errorCode": "RESOURCE_CONFLICT",     // alias conservé pour les clients déjà déployés
  "path": "/cultures/…/recolte",
  "statusCode": 409,
  "timestamp": "2026-05-18T10:00:00.000Z",
  "requestId": "…"
}
```

Le client ne doit **jamais** brancher sa logique sur le texte de `message`
(traduisible, susceptible d'évoluer) mais sur `code`, dont le catalogue complet
vit dans `src/common/errors/error-codes.ts` :

| Domaine | Codes |
| ------- | ----- |
| Validation | `VALIDATION_ERROR`, `VALIDATION_REQUIRED`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_INVALID_VALUE`, `VALIDATION_UNKNOWN_FIELD` |
| Authentification | `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_UNAUTHORIZED`, `AUTH_FORBIDDEN` |
| Ressources | `RESOURCE_NOT_FOUND`, `RESOURCE_CONFLICT`, `RESOURCE_ALREADY_EXISTS`, `USER_EMAIL_ALREADY_EXISTS` |
| Requête | `BAD_REQUEST`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `TOO_MANY_REQUESTS` |
| Serveur | `SERVER_ERROR`, `SERVER_UNAVAILABLE` |

### 7.1 Validation indexée (rattacher l'erreur au bon champ)

Une erreur de validation porte la liste **indexée** des champs fautifs, ce qui
permet au mobile d'afficher l'erreur sous le bon champ — y compris dans une liste
dynamique (`pointsGPS`) :

```jsonc
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Certaines informations sont invalides.",
  "fields": [
    {
      "field": "pointsGPS.0.latitude",           // chemin lisible
      "path": ["pointsGPS", 0, "latitude"],   // chemin structuré
      "code": "VALIDATION_INVALID_FORMAT",
      "message": "Latitude invalide (entre -90 et 90)."
    }
  ]
}
```

* un seul message par champ (la contrainte la plus significative) ;
* messages **en français** : les DTO portent le vocabulaire métier, les
  contraintes techniques (`@IsLatitude()`, `@IsNumber()`) sont traduites par
  `common/validation/messages-validation.ts` — l'anglais par défaut de
  class-validator ne sort jamais ;
* les valeurs renvoyées sont tronquées (120 caractères) et jamais des objets.

### 7.2 Statuts HTTP

`200` requête traitée — `201` ressource créée — `204` sans contenu —
`400` requête invalide — `401` non authentifié / identifiants invalides —
`403` droits insuffisants — `404` ressource inexistante **ou appartenant à un
autre utilisateur** (aucune fuite d'existence) — `409` conflit —
`413` fichier trop volumineux (5 Mo) — `415` type de fichier refusé —
`429` trop de requêtes — `500` erreur interne — `503` service indisponible.

Les opérations qui ne créent aucune ressource répondent `200` :
`POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`,
`POST /auth/reset-password`, `POST /sync`, `POST /actions/sync`,
`POST /actions/batch-sync`.

Codes de base de données traduits : `23505` → 409
`USER_EMAIL_ALREADY_EXISTS` (ou `RESOURCE_ALREADY_EXISTS`), `23503` → 409
`RESOURCE_CONFLICT`. Les erreurs multer sont traduites
(`LIMIT_FILE_SIZE` → 413 `PAYLOAD_TOO_LARGE`).
Aucune stack trace, requête SQL ou message anglais n'est exposée au client.

### 7.3 Configuration unique (`app.setup.ts`)

CORS, validation, filtre d'erreurs, intercepteurs et dossier statique des
uploads sont appliqués par `configurerApplication()` — appelée par `main.ts`
**et** par les tests e2e. Les deux configurations avaient divergé (les tests ne
validaient plus l'indexation des champs) : un test vert ne décrivait plus le
comportement réel. Il n'y a plus qu'un seul endroit à modifier.

---

## 8. Endpoints principaux

| Méthode | Route                                    | Description                          |
| ------- | ---------------------------------------- | ------------------------------------ |
| POST    | `/auth/register` `/auth/login`           | Inscription / connexion (JWT)        |
| GET     | `/auth/me`                               | Profil courant                       |
| POST    | `/auth/forgot-password` `/auth/reset-password` | Réinitialisation (jeton haché)  |
| GET     | `/users/me` · PATCH `/users/me`          | Profil                               |
| GET/POST| `/parcelles`                             | Liste paginée / création             |
| GET/PATCH/DELETE | `/parcelles/:id`                | Détail / modification / suppression logique |
| PUT     | `/parcelles/:id/delimitation`            | Délimitation GPS (recalcul superficie) |
| GET/POST| `/parcelles/:parcelleId/cultures`        | Cultures d'une parcelle              |
| PATCH   | `/parcelles/:parcelleId/cultures/:id`    | Modification (transitions contrôlées)|
| GET/POST| `/cultures/:cultureId/interventions`     | Interventions (statut auto)          |
| GET/PATCH/DELETE | `/interventions/:id`            | Intervention par identifiant (mobile)|
| GET/POST| `/cultures/:cultureId/observations`      | Observations                         |
| GET/PATCH/DELETE | `/observations/:id`             | Observation par identifiant (mobile) |
| GET     | `/cultures/:id`                          | Culture par identifiant (mobile)     |
| POST    | `/cultures/:cultureId/recolte`           | Récolte transactionnelle             |
| GET     | `/recommendations/me`                    | Recommandations                      |
| POST    | `/sync` (alias `/actions/sync`, `/actions/batch-sync`) | Synchronisation idempotente |

Les routes « plates » (`/interventions/:id`, `/observations/:id`, `/cultures/:id`)
appliquent **exactement le même contrôle d'ownership** que les routes imbriquées :
la culture est retrouvée à partir de la ressource, puis vérifiée comme appartenant
à l'utilisateur (`404` sinon). Elles existent parce que le mobile édite et supprime
une intervention ou une observation à partir de son seul identifiant ; le
vérificateur `npm run verifier:api` (dépôt mobile) garantit que les deux surfaces
restent alignées.
| GET     | `/dashboard` · `/health`                 | Indicateurs / état de santé          |

---

## 9. Tests

```bash
npm test                                  # 86 tests unitaires / 12 suites
npm run test:e2e                          # 17 tests d'intégration / 2 suites (base réelle)
bash scripts/smoke-test.sh                # 38 vérifications (parcours complet, curl)
bash scripts/smoke-dates.sh http://127.0.0.1:3000   # 25 assertions : contrat de dates,
                                          # règles métier, synchronisation, cloisonnement
bash scripts/qa-contrat-erreurs.sh        # 22 vérifications : codes d'erreur, champs
                                          # indexés, statuts, uploads (415 / 413)
```

`scripts/smoke-test.sh` couvre le parcours complet : inscription, parcelle et
délimitation, culture, interventions (statut automatique), observation, récolte
(→ culture `RECOLTEE`), idempotence de la synchronisation, contrôle de propriété,
suppression logique et mot de passe oublié.

`scripts/qa-contrat-erreurs.sh` joue un client réel (curl) et vérifie ce que
l'utilisateur observe : code et message d'un mot de passe erroné, email déjà
utilisé, jeton absent, **index du tableau transmis** (`pointsGPS.0.latitude`),
champ inconnu refusé, ressource d'un autre utilisateur masquée en 404, photo
acceptée, fichier trop volumineux refusé en 413, faux JPEG refusé en 415.

`scripts/smoke-dates.sh` (25 assertions, nécessite `jq`) vérifie ce que le mobile
ne doit jamais calculer lui-même :

* date métier refusant un instant ISO et une date non normalisée (400) ;
* horodatage refusant une date sans heure (400) ;
* statut d'intervention déduit de la date (passée → `EN_COURS`, future → `PLANIFIEE`) ;
* superficie recalculée par le serveur à partir du polygone ;
* statut de culture réconcilié à la création **et** à la relecture ;
* récolte transactionnelle (culture → `RECOLTEE`) ;
* contrat de synchronisation : action hors vocabulaire refusée (400),
  `CREATE/OBSERVATION` → `SYNCED` puis `DUPLICATE` au rejeu, **aucun doublon créé** ;
* cloisonnement : la parcelle d'un autre utilisateur reste invisible (404).

---

## 10. Sécurité

* Mots de passe hachés (bcrypt, 10 tours) et **jamais renvoyés** par l'API.
* Jeton de réinitialisation stocké **haché** (SHA-256) et à usage unique ;
  réponse identique pour un email inconnu (anti-énumération).
* Toutes les routes sont protégées par défaut (garde JWT globale) ; `@Public()`
  pour les exceptions.
* Validation stricte : `whitelist: true` + `forbidNonWhitelisted: true`
  (un champ inattendu provoque un 400).
* Uploads : **extension et** type MIME doivent désigner une image
  (`jpg`, `jpeg`, `png`, `webp`), taille limitée à 5 Mo, nom de fichier
  régénéré côté serveur — le nom fourni par le client n'est jamais utilisé.
* CORS restreint par `CORS_ORIGINS` ; `x-request-id` sur chaque réponse.
