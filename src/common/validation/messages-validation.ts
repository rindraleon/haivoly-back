/**
 * Messages de validation en français, compréhensibles par l'utilisateur final.
 *
 * Les DTO déclarent leurs messages métier (`@IsNotEmpty({ message: 'Le nom de la
 * parcelle est obligatoire' })`). Pour les décorateurs sans message — les
 * contraintes « techniques » comme `@IsLatitude()` — class-validator génère un
 * message anglais du type `latitude must be a latitude string or number`, qui ne
 * doit jamais atteindre l'écran.
 *
 * On détecte ces messages par défaut (ils commencent par le nom de la
 * propriété, `each` pour les tableaux) et on les remplace par une phrase
 * française. Les messages explicites des DTO sont conservés **tels quels** :
 * ils portent le vocabulaire métier.
 */
import type { ErrorCodeValue } from '../errors/error-codes';
import { ErrorCode } from '../errors/error-codes';

/** Message générique quand la contrainte n'a pas d'équivalent français connu. */
const MESSAGE_GENERIQUE = 'Valeur invalide.';

const MESSAGES: Record<string, string> = {
  // Présence
  isDefined: 'Ce champ est obligatoire.',
  isNotEmpty: 'Ce champ est obligatoire.',
  isNotEmptyObject: 'Ce champ est obligatoire.',
  whitelistValidation: "Ce champ n'est pas attendu.",
  nestedValidation: 'Élément invalide.',

  // Types
  isString: 'Ce champ doit être du texte.',
  isNumber: 'Ce champ doit être un nombre.',
  isInt: 'Ce champ doit être un nombre entier.',
  isBoolean: 'Cette valeur doit être vrai ou faux.',
  isArray: 'Ce champ doit être une liste.',
  isObject: 'Ce champ doit être un objet.',
  isUUID: 'Identifiant invalide.',
  isEnum: 'Valeur non autorisée.',
  isIn: 'Valeur non autorisée.',

  // Formats
  isEmail: 'Adresse email invalide.',
  isLatitude: 'Latitude invalide (entre -90 et 90).',
  isLongitude: 'Longitude invalide (entre -180 et 180).',
  isDate: 'Date invalide (format attendu : AAAA-MM-JJ).',
  isDateString: 'Date invalide (format attendu : AAAA-MM-JJ).',
  isInstantIso:
    'Date et heure invalides (format attendu : 2026-03-01T08:00:00.000Z).',
  isPhoneNumber: 'Numéro de téléphone invalide.',
  isUrl: 'Lien invalide.',
  matches: 'Format invalide.',
  isNumberString: 'Ce champ doit contenir uniquement des chiffres.',

  // Bornes et longueurs
  min: 'Valeur inférieure au minimum autorisé.',
  max: 'Valeur supérieure au maximum autorisé.',
  minLength: 'Texte trop court.',
  maxLength: 'Texte trop long.',
  length: 'Longueur du texte incorrecte.',
  arrayMinSize: 'Liste trop courte.',
  arrayMaxSize: 'Liste trop longue.',
  isPositive: 'La valeur doit être positive.',
  isNegative: 'La valeur doit être négative.',
};

/**
 * Vrai si le message vient de class-validator et n'a pas été personnalisé.
 *
 * Les messages par défaut commencent toujours par le nom de la propriété :
 * `latitude must be a latitude string or number`, `each value in pointsGPS …`.
 */
export function estMessageParDefaut(
  message: string,
  propriete: string,
): boolean {
  if (!propriete) return false;
  return (
    message.startsWith(`${propriete} `) ||
    message.startsWith(`each value in ${propriete} `) ||
    message.startsWith(`each value in ${propriete}.`) ||
    message.startsWith(`${propriete}.`)
  );
}

/** Nature de l'erreur à partir du nom de contrainte class-validator. */
export function codeDeContrainte(contrainte: string): ErrorCodeValue {
  if (contrainte === 'isDefined' || contrainte === 'isNotEmpty') {
    return ErrorCode.VALIDATION_REQUIRED;
  }
  if (
    contrainte === 'whitelistValidation' ||
    contrainte === 'nestedValidation'
  ) {
    return ErrorCode.UNKNOWN_FIELD;
  }
  if (
    contrainte === 'min' ||
    contrainte === 'max' ||
    contrainte === 'length' ||
    contrainte === 'minLength' ||
    contrainte === 'maxLength' ||
    contrainte === 'minIn' ||
    contrainte === 'arrayMinSize' ||
    contrainte === 'arrayMaxSize' ||
    contrainte === 'isIn' ||
    contrainte === 'isEnum'
  ) {
    return ErrorCode.VALIDATION_INVALID_VALUE;
  }
  if (
    contrainte.startsWith('is') ||
    contrainte === 'matches' ||
    contrainte === 'isInstantIso'
  ) {
    return ErrorCode.VALIDATION_INVALID_FORMAT;
  }
  return ErrorCode.VALIDATION_INVALID_VALUE;
}

/**
 * Message affichable pour un champ fautif.
 *
 * @param contrainte nom de la contrainte class-validator (`isLatitude`…)
 * @param propriete  nom de la propriété du DTO (`latitude`…)
 * @param message    message éventuel déclaré dans le DTO
 */
export function messageChamp(
  contrainte: string,
  propriete: string,
  message: string | undefined,
): string {
  if (message && !estMessageParDefaut(message, propriete)) {
    return message;
  }
  return MESSAGES[contrainte] ?? MESSAGE_GENERIQUE;
}
