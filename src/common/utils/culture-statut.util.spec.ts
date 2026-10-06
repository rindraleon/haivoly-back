import { StatutCulture } from '../enums/domain.enums';
import { statutCultureAJour } from './culture-statut.util';

describe('statutCultureAJour', () => {
  const AUJOURDHUI = '2026-10-06';

  it('passe une culture planifiée en cours quand la date de plantation est atteinte', () => {
    expect(
      statutCultureAJour(StatutCulture.PLANIFIEE, '2026-05-18', AUJOURDHUI),
    ).toBe(StatutCulture.EN_COURS);
  });

  it('garde en planifiée une plantation encore à venir', () => {
    expect(
      statutCultureAJour(StatutCulture.PLANIFIEE, '2027-01-15', AUJOURDHUI),
    ).toBe(StatutCulture.PLANIFIEE);
  });

  it('considère comme en cours une culture sans date de plantation', () => {
    expect(statutCultureAJour(StatutCulture.PLANIFIEE, null, AUJOURDHUI)).toBe(
      StatutCulture.EN_COURS,
    );
  });

  it('bascule le jour même de la plantation', () => {
    expect(
      statutCultureAJour(StatutCulture.PLANIFIEE, AUJOURDHUI, AUJOURDHUI),
    ).toBe(StatutCulture.EN_COURS);
  });

  it('ne touche jamais aux statuts terminaux', () => {
    [
      StatutCulture.RECOLTEE,
      StatutCulture.SUPPRIMEE,
      StatutCulture.ABANDONNEE,
    ].forEach((statut) => {
      expect(statutCultureAJour(statut, '2026-01-01', AUJOURDHUI)).toBe(statut);
    });
  });

  it('accepte une date hydratée en objet Date (minuit UTC)', () => {
    expect(
      statutCultureAJour(
        StatutCulture.PLANIFIEE,
        new Date('2026-05-18T00:00:00.000Z'),
        AUJOURDHUI,
      ),
    ).toBe(StatutCulture.EN_COURS);
  });
});
