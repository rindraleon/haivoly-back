import { StatutCulture } from '../enums/domain.enums';
import { toDateOnly } from './date.util';

/**
 * Cycle de vie d'une culture — règle serveur.
 *
 * Une culture `PLANIFIEE` dont la date de plantation est **atteinte** (ou qui
 * n'en a pas) est une culture en cours : c'est la même règle que pour les
 * interventions (« date future → planifiée, date passée → en cours »).
 *
 * Le serveur est la seule source de vérité : le mobile affiche le statut reçu
 * et n'en déduit jamais un autre. Les statuts terminaux (`RECOLTEE`,
 * `ABANDONNEE`, `SUPPRIMEE`) ne sont jamais modifiés ici.
 */
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
