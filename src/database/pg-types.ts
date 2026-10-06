import { types } from 'pg';

/**
 * Normalisation des types PostgreSQL — **correction du bug de fuseau horaire**.
 *
 * Comportement par défaut du pilote `pg` (source de bugs « décalage d'un jour »
 * et de `Invalid Date` dans l'application mobile) :
 *   • `timestamp without time zone` (OID 1114) → interprété comme heure locale
 *   • `date` (OID 1082)                         → interprété comme minuit local
 *
 * Dès que le fuseau du serveur n'est pas UTC (Europe/Moscou = UTC+3), une date
 * enregistrée `2026-05-18` ressortait décalée. On impose donc une lecture
 * **UTC** et, pour les colonnes `date`, on renvoie directement la chaîne
 * `YYYY-MM-DD` : plus aucune conversion intermédiaire n'est possible.
 *
 * Ce module doit être importé avant toute création de connexion.
 */
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
