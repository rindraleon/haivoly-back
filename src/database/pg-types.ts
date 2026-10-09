import { types } from 'pg';

const PG_TYPE_DATE = 1082;
const PG_TYPE_TIMESTAMP_WITHOUT_TZ = 1114;

let alreadyConfigured = false;

export function configurePgTypes(): void {
  if (alreadyConfigured) return;
  alreadyConfigured = true;

  // DATE → chaîne `YYYY-MM-DD` (jamais un objet Date).
  types.setTypeParser(PG_TYPE_DATE, (value: string) => value);

  // TIMESTAMP sans fuseau → instant UTC explicite.
  types.setTypeParser(
    PG_TYPE_TIMESTAMP_WITHOUT_TZ,
    (value: string) => new Date(`${value.replace(' ', 'T')}Z`),
  );
}

configurePgTypes();
