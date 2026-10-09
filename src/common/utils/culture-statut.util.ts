import { StatutCulture } from '../enums/domain.enums';
import { toDateOnly } from './date.util';

export function statutCultureAJour(
  statut: StatutCulture,
  datePlantation: string | Date | null | undefined,
  aujourdHui: string | null = toDateOnly(new Date()),
): StatutCulture {
  if (statut !== StatutCulture.PLANIFIEE) {
    return statut;
  }

  const plantation = toDateOnly(datePlantation);

  // Plantation future : la culture reste planifiée.
  if (plantation && aujourdHui && plantation > aujourdHui) {
    return statut;
  }

  return StatutCulture.EN_COURS;
}

/** Vrai si la culture peut encore évoluer (hors statuts terminaux). */
export function cultureModifiable(statut: StatutCulture): boolean {
  return (
    statut !== StatutCulture.RECOLTEE && statut !== StatutCulture.SUPPRIMEE
  );
}
