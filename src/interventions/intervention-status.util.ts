import { StatutIntervention } from '../common/enums/domain.enums';

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
