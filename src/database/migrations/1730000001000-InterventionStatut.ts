import { MigrationInterface, QueryRunner } from 'typeorm';

export class InterventionStatut1730000001000 implements MigrationInterface {
  name = 'InterventionStatut1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "StatutIntervention" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "Intervention"
      ADD COLUMN IF NOT EXISTS "statut" "StatutIntervention" NOT NULL DEFAULT 'EN_COURS';
    `);

    // Backfill : uniquement les lignes jamais renseignées par la règle métier.
    await queryRunner.query(`
      UPDATE "Intervention"
      SET "statut" = CASE
        WHEN "date" > NOW() THEN 'PLANIFIEE'::"StatutIntervention"
        ELSE 'EN_COURS'::"StatutIntervention"
      END
      WHERE "statut" = 'EN_COURS'::"StatutIntervention"
        AND "date" > NOW();
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Intervention_statut" ON "Intervention" ("statut");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Intervention" DROP COLUMN IF EXISTS "statut";`,
    );
  }
}
