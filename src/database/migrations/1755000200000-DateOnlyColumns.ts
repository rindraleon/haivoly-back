import { MigrationInterface, QueryRunner } from 'typeorm';

export class DateOnlyColumns1755000200000 implements MigrationInterface {
  name = 'DateOnlyColumns1755000200000';

  private readonly colonnes: Array<{ table: string; colonne: string }> = [
    { table: 'Culture', colonne: 'datePlantation' },
    { table: 'Culture', colonne: 'datePrevueRecolte' },
    { table: 'Recolte', colonne: 'dateRecolte' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, colonne } of this.colonnes) {
      const existe = (await queryRunner.query(
        `SELECT data_type AS "type"
           FROM information_schema.columns
          WHERE table_name = $1 AND column_name = $2`,
        [table, colonne],
      )) as Array<{ type: string | null }>;

      if (existe.length === 0) {
        continue; // table absente (base vierge avant baseline)
      }

      if (existe[0].type === 'date') {
        continue; // déjà converti
      }

      await queryRunner.query(
        `ALTER TABLE "${table}"
           ALTER COLUMN "${colonne}" TYPE date
           USING (("${colonne}" AT TIME ZONE 'UTC')::date)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, colonne } of this.colonnes) {
      await queryRunner.query(
        `ALTER TABLE "${table}"
           ALTER COLUMN "${colonne}" TYPE timestamp(3) without time zone
           USING ("${colonne}"::timestamp)`,
      );
    }
  }
}
