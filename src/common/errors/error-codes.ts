/**
 * Catalogue des codes d'erreur **partagés avec le mobile**.
 *
 * Règle : le mobile ne doit jamais dépendre du texte d'un message (il peut être
 * reformulé ou traduit) mais du `code`. Chaque code a une sémantique stable, et
 * un code HTTP associé côté filtre.
 *
 * Convention de nommage : `DOMAINE_REASON` en majuscules.
 */
export const ErrorCode = {
  // ── Validation ────────────────────────────────────────────────
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_VALUE: 'VALIDATION_INVALID_VALUE',
  UNKNOWN_FIELD: 'VALIDATION_UNKNOWN_FIELD',

  // ── Authentification / autorisation ───────────────────────────
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // ── Ressources ────────────────────────────────────────────────
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  USER_EMAIL_ALREADY_EXISTS: 'USER_EMAIL_ALREADY_EXISTS',

  // ── Requête / transport ───────────────────────────────────────
  BAD_REQUEST: 'BAD_REQUEST',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // ── Serveur ───────────────────────────────────────────────────
  SERVER_ERROR: 'SERVER_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Code générique associé à un statut HTTP (repli). */
export function codeParStatut(status: number): ErrorCodeValue {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.AUTH_UNAUTHORIZED;
    case 403:
      return ErrorCode.AUTH_FORBIDDEN;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCode.RESOURCE_CONFLICT;
    case 413:
      return ErrorCode.PAYLOAD_TOO_LARGE;
    case 415:
      return ErrorCode.UNSUPPORTED_MEDIA_TYPE;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.TOO_MANY_REQUESTS;
    case 503:
      return ErrorCode.SERVER_UNAVAILABLE;
    default:
      return ErrorCode.SERVER_ERROR;
  }
}

/**
 * Traduit une exception métier en code précis.
 *
 * Les services lèvent déjà des messages français explicites ; on leur associe
 * ici le code que le mobile utilisera pour réagir (afficher l'erreur au bon
 * endroit, proposer une action…). Le `message` reste inchangé.
 */
export function codePourMessage(
  message: string,
  status: number,
): ErrorCodeValue {
  const texte = message.toLowerCase();

  if (status === 409 && (texte.includes('email') || texte.includes('e-mail'))) {
    return ErrorCode.USER_EMAIL_ALREADY_EXISTS;
  }
  if (status === 401) {
    if (texte.includes('expir')) return ErrorCode.AUTH_SESSION_EXPIRED;
    // « Email ou mot de passe incorrect » = tentative de connexion refusée ;
    // tout autre 401 (jeton absent, invalide, compte supprimé) relève d'un
    // défaut d'authentification, pas d'identifiants erronés.
    if (texte.includes('mot de passe') || texte.includes('identifiant')) {
      return ErrorCode.AUTH_INVALID_CREDENTIALS;
    }
    return ErrorCode.AUTH_UNAUTHORIZED;
  }
  if (status === 404) return ErrorCode.RESOURCE_NOT_FOUND;
  if (status === 409) return ErrorCode.RESOURCE_CONFLICT;
  return codeParStatut(status);
}

/**
 * Traduit les messages techniques en messages utilisateur.
 *
 * `@nestjs/platform-express` transforme les erreurs multer en
 * `PayloadTooLargeException('File too large')` ; Nest lui-même génère des
 * messages anglais (`Unsupported Media Type`). Ces textes ne doivent jamais
 * s'afficher sur un écran : on les remplace par une phrase française.
 */
const MESSAGE_VALIDATION_FR = 'Certaines informations sont invalides.';

const MESSAGES_PAR_STATUT: Record<number, string> = {
  413: "Le fichier est trop volumineux (5 Mo maximum). Reprenez la photo : elle est compressée automatiquement avant l'envoi.",
  415: 'Format de fichier non pris en charge. Envoyez une image JPG, PNG ou WEBP.',
  429: 'Trop de tentatives. Patientez un instant avant de réessayer.',
  502: 'Le service est momentanément indisponible. Réessayez dans quelques instants.',
  503: 'Le service est momentanément indisponible. Réessayez dans quelques instants.',
};

const MESSAGES_TECHNIQUES: Record<string, string> = {
  'File too large': MESSAGES_PAR_STATUT[413],
  'Unexpected field': 'Envoi de fichier invalide.',
  'Too many files': 'Trop de fichiers envoyés en une seule fois.',
  'Too many parts': 'Envoi trop volumineux.',
  'Multipart: Boundary not found': 'Envoi de fichier incomplet.',
  'Unsupported Media Type': MESSAGES_PAR_STATUT[415],
  'Payload Too Large': MESSAGES_PAR_STATUT[413],
  'Internal Server Error':
    'Une erreur interne est survenue. Réessayez dans quelques instants.',
  Unauthorized: 'Vous devez être connecté pour accéder à cette ressource.',
  Forbidden: "Vous n'avez pas les droits nécessaires pour cette action.",
  'Not Found': 'Ressource introuvable.',
  'Bad Request': 'Requête invalide.',
  'Validation failed': MESSAGE_VALIDATION_FR,
};

/**
 * Message destiné à l'utilisateur : français, sans jargon.
 * Un message déjà rédigé (métier, contrôlé) est conservé tel quel.
 */
export function messageUtilisateur(message: string, status: number): string {
  const connu = MESSAGES_TECHNIQUES[message];
  if (connu) return connu;
  // Statuts dont le texte par défaut est toujours technique.
  if (status === 413) return MESSAGES_PAR_STATUT[413];
  if (message === 'Validation failed') return MESSAGE_VALIDATION_FR;
  return message;
}
