/**
 * Indexation des erreurs de validation.
 *
 * `ValidationPipe` renvoie des `ValidationError` **imbriquées** (objets, tableaux
 * d'objets). Le mobile a besoin de savoir *quel champ* corriger : on aplatit donc
 * l'arbre en une liste de champs fautifs, chacun identifié par
 *
 *   • `field` : chemin lisible et pointé, index compris — `pointsGPS.0.latitude` ;
 *   • `path`  : le même chemin sous forme structurée — `['pointsGPS', 0, 'latitude']`
 *               (utilisable directement pour localiser l'élément dans un
 *               formulaire dynamique, sans re-parser une chaîne) ;
 *   • `code`  : nature de l'erreur (obligatoire, format, valeur…) ;
 *   • `message`: message français prêt à afficher ;
 *   • `value` : valeur refusée, quand elle est sûre à exposer.
 *
 * Contrat renvoyé au client (corps de la réponse) :
 *
 * ```json
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "code": "VALIDATION_ERROR",
 *   "message": "Certaines informations sont invalides",
 *   "fields": [
 *     { "field": "email", "path": ["email"], "code": "VALIDATION_INVALID_FORMAT",
 *       "message": "Email invalide" },
 *     { "field": "pointsGPS.1.latitude", "path": ["pointsGPS", 1, "latitude"],
 *       "code": "VALIDATION_REQUIRED", "message": "La latitude est obligatoire" }
 *   ]
 * }
 * ```
 */
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

/**
 * Aplatit l'arbre `ValidationError[]` en champs fautifs indexés.
 *
 * Un même champ peut cumuler plusieurs contraintes : on conserve la **première**
 * (la plus significative, class-validator les expose dans l'ordre de déclaration)
 * pour ne pas afficher trois messages sous un seul champ.
 */
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
