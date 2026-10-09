import type { ValidationError } from '@nestjs/common';

import { ErrorCode, type ErrorCodeValue } from '../errors/error-codes';
import { codeDeContrainte, messageChamp } from './messages-validation';

export interface ChampInvalide {
  /** Chemin pointé, index inclus : `pointsGPS.0.latitude`. */
  field: string;
  /** Même chemin, structuré : `['pointsGPS', 0, 'latitude']`. */
  path: (string | number)[];
  code: ErrorCodeValue;
  message: string;
  /** Valeur refusée (omise si trop volumineuse ou sensible). */
  value?: unknown;
}

/** Une clé entièrement numérique désigne un index de tableau. */
function estIndex(cle: string): boolean {
  return /^\d+$/.test(cle);
}

function chemin(path: (string | number)[]): string {
  return path.join('.');
}

/** Nature de l'erreur à partir des contraintes class-validator appliquées. */
const codeDe = codeDeContrainte;

/** Valeur exposable : les structures complexes sont résumées. */
function valeurExposable(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  const type = typeof value;
  if (type === 'string') {
    const texte = value as string;
    return texte.length > 120 ? `${texte.slice(0, 120)}…` : texte;
  }
  if (type === 'number' || type === 'boolean') return value;
  return undefined;
}

export function champsInvalides(
  erreurs: ValidationError[],
  prefixe: (string | number)[] = [],
): ChampInvalide[] {
  const champs: ChampInvalide[] = [];

  for (const erreur of erreurs) {
    // `whitelistValidation` : propriété inconnue refusée par `forbidNonWhitelisted`.
    const propriete = erreur.property ?? '';
    const dansTableau = estIndex(propriete);
    const segment: string | number = dansTableau
      ? Number(propriete)
      : propriete;
    const cheminCourant = [...prefixe, segment];

    if (erreur.constraints && Object.keys(erreur.constraints).length > 0) {
      const [contrainte, message] = Object.entries(erreur.constraints)[0];
      champs.push({
        field: chemin(cheminCourant),
        path: cheminCourant,
        code: codeDe(contrainte),
        // Message français : les DTO portent le vocabulaire métier, les
        // contraintes techniques sont traduites (jamais « latitude must be… »).
        message: messageChamp(contrainte, propriete, message),
        value: valeurExposable(erreur.value),
      });
    } else if (erreur.children?.length) {
      // Conteneurs (objets ou tableaux) : on descend sans créer d'entrée vide.
      champs.push(...champsInvalides(erreur.children, cheminCourant));
    } else if (propriete) {
      champs.push({
        field: chemin(cheminCourant),
        path: cheminCourant,
        code: ErrorCode.VALIDATION_INVALID_VALUE,
        message: 'Valeur invalide.',
        value: valeurExposable(erreur.value),
      });
    }
  }

  return champs;
}

/** Message global : neutre, sans détail technique. */
export const MESSAGE_VALIDATION = 'Certaines informations sont invalides.';
