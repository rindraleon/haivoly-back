/**
 * Enums métier — miroir exact des enums PostgreSQL existants.
 * Ne jamais renommer une valeur : elles sont persistées en base.
 */

export enum Role {
  AGRICULTEUR = 'AGRICULTEUR',
  PROPRIETAIRE = 'PROPRIETAIRE',
}

export enum StatutParcelle {
  ACTIVE = 'ACTIVE',
  ABANDONNEE = 'ABANDONNEE',
  ARCHIVEE = 'ARCHIVEE',
  SUPPRIMEE = 'SUPPRIMEE',
}

export enum StatutCulture {
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  RECOLTEE = 'RECOLTEE',
  ABANDONNEE = 'ABANDONNEE',
  SUPPRIMEE = 'SUPPRIMEE',
}

export enum TypeIntervention {
  PLANTATION = 'PLANTATION',
  IRRIGATION = 'IRRIGATION',
  FERTILISATION = 'FERTILISATION',
  DESHERBAGE = 'DESHERBAGE',
  TRAITEMENT = 'TRAITEMENT',
  ENTRETIEN = 'ENTRETIEN',
  INSPECTION = 'INSPECTION',
  AUTRE = 'AUTRE',
}

/**
 * Statut d'une intervention.
 * Il est calculé automatiquement par le backend à partir de la date
 * (source de vérité) — il ne doit jamais être fourni par le client.
 */
export enum StatutIntervention {
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
}

export enum RecommendationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ALERT = 'ALERT',
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const ALL_INTERVENTION_TYPES = Object.values(TypeIntervention);
export const ALL_CULTURE_STATUSES = Object.values(StatutCulture);
