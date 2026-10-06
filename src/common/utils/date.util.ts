/**
 * Convention de dates Haivoly
 * ────────────────────────────
 * • Date métier sans heure  → "YYYY-MM-DD" (colonne PostgreSQL de type date
 *   ou timestamp 00:00:00Z selon le modèle existant).
 * • Date + heure            → ISO-8601 UTC "YYYY-MM-DDTHH:mm:ss.sssZ".
 *
 * Règles :
 *  1. On parse UNE seule fois (frontière du service) — jamais dans l'entité.
 *  2. On n'utilise `toISOString()` que pour sérialiser vers le client.
 *  3. Toute date invalide lève une erreur explicite plutôt que `Invalid Date`.
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // Date seule : on l'ancre à minuit UTC pour éviter tout décalage de fuseau
  // (le poste client peut être en UTC+3, le serveur en UTC).
  const parsed = DATE_ONLY_REGEX.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Parse ou lève une exception métier — préférable dans les services. */
export function requireDate(
  value: string | Date | null | undefined,
  field: string,
): Date {
  const parsed = parseDate(value);
  if (!parsed) {
    throw new DateParseError(field, value);
  }
  return parsed;
}

/**
 * Valide une date calendaire et la renvoie telle quelle (`YYYY-MM-DD`).
 *
 * Utilisée par les services dont la colonne PostgreSQL est de type `date` :
 * on ne convertit jamais en objet `Date`, ce qui élimine toute possibilité de
 * décalage de fuseau ou d'`Invalid Date`.
 */
export function requireDateOnly(value: unknown, field: string): string {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) {
    throw new DateParseError(field, value);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new DateParseError(field, value);
  }

  // Rejette les dates inexistantes (« 2026-02-31 »).
  if (parsed.toISOString().slice(0, 10) !== value) {
    throw new DateParseError(field, value);
  }

  return value;
}

/** Sérialise une date métier sans heure en "YYYY-MM-DD". */
export function toDateOnly(
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/** Sérialise en ISO-8601 UTC complet. */
export function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseDate(value);
  return d ? d.toISOString() : null;
}

export class DateParseError extends Error {
  constructor(
    readonly field: string,
    readonly value: unknown,
  ) {
    super(`Date invalide pour le champ « ${field} »`);
    this.name = 'DateParseError';
  }
}
