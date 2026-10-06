import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION BASELINE — NON DESTRUCTIVE
 * ────────────────────────────────────
 * Reproduit exactement le schéma PostgreSQL produit historiquement par les
 * migrations Prisma (noms de tables, colonnes, enums, index et contraintes
 * compris), mais de façon IDEMPOTENTE :
 *
 *   • base neuve            → crée tout le schéma
 *   • base déjà existante   → aucune opération (IF NOT EXISTS), données intactes
 *
 * Aucun DROP, aucun TRUNCATE, aucun ALTER destructif.
 */
export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────────────────────
    // 1. Enum types
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('AGRICULTEUR', 'PROPRIETAIRE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "StatutParcelle" AS ENUM ('ACTIVE', 'ABANDONNEE', 'ARCHIVEE', 'SUPPRIMEE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "StatutCulture" AS ENUM ('PLANIFIEE', 'EN_COURS', 'RECOLTEE', 'ABANDONNEE', 'SUPPRIMEE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "TypeIntervention" AS ENUM ('PLANTATION', 'IRRIGATION', 'FERTILISATION', 'DESHERBAGE', 'TRAITEMENT', 'ENTRETIEN', 'INSPECTION', 'AUTRE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ─────────────────────────────────────────────────────────────
    // 2. Tables
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Utilisateur" (
        "id" TEXT NOT NULL,
        "nom" TEXT NOT NULL,
        "prenom" TEXT,
        "email" TEXT NOT NULL,
        "telephone" TEXT,
        "password" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'AGRICULTEUR',
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Parcelle" (
        "id" TEXT NOT NULL,
        "nom" TEXT NOT NULL,
        "superficie" DOUBLE PRECISION,
        "typeSol" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "description" TEXT,
        "statut" "StatutParcelle" NOT NULL DEFAULT 'ACTIVE',
        "raisonSuppression" TEXT,
        "utilisateurId" TEXT NOT NULL,
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Parcelle_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PointGPS" (
        "id" TEXT NOT NULL,
        "ordre" INTEGER NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "parcelleId" TEXT NOT NULL,
        "creeA" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PointGPS_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Culture" (
        "id" TEXT NOT NULL,
        "nom" TEXT NOT NULL,
        "type" TEXT,
        "variete" TEXT,
        "datePlantation" TIMESTAMP(3),
        "datePrevueRecolte" TIMESTAMP(3),
        "description" TEXT,
        "stade" TEXT,
        "statut" "StatutCulture" NOT NULL DEFAULT 'PLANIFIEE',
        "raisonSuppression" TEXT,
        "parcelleId" TEXT NOT NULL,
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Culture_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PointGPSCulture" (
        "id" TEXT NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "ordre" INTEGER NOT NULL,
        "cultureId" TEXT NOT NULL,
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PointGPSCulture_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Intervention" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "produit" TEXT,
        "quantite" DOUBLE PRECISION,
        "unite" TEXT,
        "cout" DOUBLE PRECISION,
        "cultureId" TEXT NOT NULL,
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PhotoIntervention" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "description" TEXT,
        "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "interventionId" TEXT NOT NULL,
        CONSTRAINT "PhotoIntervention_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Observation" (
        "id" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "cultureId" TEXT NOT NULL,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Photo" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "observationId" TEXT NOT NULL,
        CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Recolte" (
        "id" TEXT NOT NULL,
        "dateRecolte" TIMESTAMP(3) NOT NULL,
        "quantite" DOUBLE PRECISION NOT NULL,
        "unite" TEXT NOT NULL,
        "description" TEXT,
        "prixVente" DOUBLE PRECISION,
        "coutRecolte" DOUBLE PRECISION,
        "cultureId" TEXT NOT NULL,
        "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifieA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Recolte_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PhotoRecolte" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "recolteId" TEXT NOT NULL,
        CONSTRAINT "PhotoRecolte_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "utilisateurId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Action" (
        "id" TEXT NOT NULL,
        "clientId" TEXT,
        "userId" TEXT NOT NULL,
        "actionType" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT,
        "payload" JSONB,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deviceId" TEXT,
        "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "syncedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB,
        CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Recommendation" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'INFO',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "readAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB,
        CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
      );
    `);

    // ─────────────────────────────────────────────────────────────
    // 3. Index & contraintes uniques
    // ─────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Utilisateur_email_key" ON "Utilisateur" ("email");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PointGPS_parcelleId_ordre_key" ON "PointGPS" ("parcelleId", "ordre");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PointGPSCulture_cultureId_ordre_key" ON "PointGPSCulture" ("cultureId", "ordre");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Recolte_cultureId_key" ON "Recolte" ("cultureId");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken" ("tokenHash");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken" ("email");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken" ("expiresAt");`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Action_clientId_key" ON "Action" ("clientId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_userId_idx" ON "Action" ("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_actionType_idx" ON "Action" ("actionType");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_entityType_idx" ON "Action" ("entityType");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_syncStatus_idx" ON "Action" ("syncStatus");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_createdAt_idx" ON "Action" ("createdAt");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Action_timestamp_idx" ON "Action" ("timestamp");`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Recommendation_userId_idx" ON "Recommendation" ("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Recommendation_type_idx" ON "Recommendation" ("type");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Recommendation_priority_idx" ON "Recommendation" ("priority");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Recommendation_createdAt_idx" ON "Recommendation" ("createdAt");`,
    );

    // Index de clés étrangères utilisés intensivement par l'API (ownership)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Parcelle_utilisateurId" ON "Parcelle" ("utilisateurId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Culture_parcelleId" ON "Culture" ("parcelleId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Intervention_cultureId" ON "Intervention" ("cultureId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Observation_cultureId" ON "Observation" ("cultureId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Photo_observationId" ON "Photo" ("observationId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_PhotoIntervention_interventionId" ON "PhotoIntervention" ("interventionId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_PhotoRecolte_recolteId" ON "PhotoRecolte" ("recolteId");`,
    );

    // ─────────────────────────────────────────────────────────────
    // 4. Clés étrangères (ajoutées seulement si absentes)
    // ─────────────────────────────────────────────────────────────
    const foreignKeys: Array<[string, string]> = [
      [
        'Parcelle_utilisateurId_fkey',
        `ALTER TABLE "Parcelle" ADD CONSTRAINT "Parcelle_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'PointGPS_parcelleId_fkey',
        `ALTER TABLE "PointGPS" ADD CONSTRAINT "PointGPS_parcelleId_fkey" FOREIGN KEY ("parcelleId") REFERENCES "Parcelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Culture_parcelleId_fkey',
        `ALTER TABLE "Culture" ADD CONSTRAINT "Culture_parcelleId_fkey" FOREIGN KEY ("parcelleId") REFERENCES "Parcelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'PointGPSCulture_cultureId_fkey',
        `ALTER TABLE "PointGPSCulture" ADD CONSTRAINT "PointGPSCulture_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Intervention_cultureId_fkey',
        `ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'PhotoIntervention_interventionId_fkey',
        `ALTER TABLE "PhotoIntervention" ADD CONSTRAINT "PhotoIntervention_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Observation_cultureId_fkey',
        `ALTER TABLE "Observation" ADD CONSTRAINT "Observation_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Photo_observationId_fkey',
        `ALTER TABLE "Photo" ADD CONSTRAINT "Photo_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Recolte_cultureId_fkey',
        `ALTER TABLE "Recolte" ADD CONSTRAINT "Recolte_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'PhotoRecolte_recolteId_fkey',
        `ALTER TABLE "PhotoRecolte" ADD CONSTRAINT "PhotoRecolte_recolteId_fkey" FOREIGN KEY ("recolteId") REFERENCES "Recolte"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'PasswordResetToken_utilisateurId_fkey',
        `ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Action_userId_fkey',
        `ALTER TABLE "Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
      [
        'Recommendation_userId_fkey',
        `ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      ],
    ];

    for (const [name, sql] of foreignKeys) {
      await queryRunner.query(`
        DO $$ BEGIN
          ${sql}
        EXCEPTION
          WHEN duplicate_object THEN NULL;
          WHEN duplicate_table THEN NULL;
        END $$;
      `);
      void name;
    }
  }

  public async down(): Promise<void> {
    // Volontairement vide : cette migration baseline n'est jamais annulée
    // (annuler reviendrait à supprimer des données métier).
  }
}
