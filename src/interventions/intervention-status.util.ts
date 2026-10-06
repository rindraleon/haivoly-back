import { StatutIntervention } from '../common/enums/domain.enums';

/**
 * RÈGLE MÉTIER (source de vérité : BACKEND)
 * ─────────────────────────────────────────
 * Le statut d'une intervention n'est jamais fourni par le client.
 * Il est déduit de sa date :
 *
 *   date > maintenant  → PLANIFIEE
 *   date <= maintenant → EN_COURS
 *
 * Une intervention explicitement clôturée (TERMINEE) n'est jamais réécrite
 * automatiquement : c'est une action métier volontaire.
 */
export function computeInterventionStatus(
  date: Date,
  now: Date = new Date(),
): StatutIntervention {
  return date.getTime() > now.getTime()
    ? StatutIntervention.PLANIFIEE
    : StatutIntervention.EN_COURS;
}

/** Normalise un statut persisté : ne touche pas à TERMINEE. */
export function normalizeInterventionStatus(
  current: StatutIntervention,
  date: Date,
  now: Date = new Date(),
): StatutIntervention {
  if (current === StatutIntervention.TERMINEE) {
    return StatutIntervention.TERMINEE;
  }
  return computeInterventionStatus(date, now);
}
