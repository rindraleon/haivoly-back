/**
 * Tests du validateur `@IsDateOnly()`.
 *
 * Il verrouille le contrat de dates du backend : les dates métier sans heure
 * (`Culture.datePlantation`, `Culture.datePrevueRecolte`, `Recolte.dateRecolte`)
 * sont des chaînes `AAAA-MM-JJ`. Un instant ISO complet est refusé, car il
 * laisse passer un décalage d'un jour selon le fuseau du client.
 */
import { plainToInstance } from 'class-transformer';
import { IsDateOnly, estDateOnly } from './is-date-only.validator';
import { validateSync } from 'class-validator';

class Exemple {
  @IsDateOnly()
  date?: string;
}

describe('estDateOnly', () => {
  it('accepte une date calendaire', () => {
    expect(estDateOnly('2026-05-18')).toBe(true);
    expect(estDateOnly('2026-02-28')).toBe(true);
    expect(estDateOnly('2024-02-29')).toBe(true); // année bissextile
  });

  it('refuse un instant ISO complet (source du décalage de fuseau)', () => {
    expect(estDateOnly('2026-05-18T00:00:00.000Z')).toBe(false);
    expect(estDateOnly('2026-05-18T21:00:00.000Z')).toBe(false);
  });

  it('refuse les formats approximatifs et les dates inexistantes', () => {
    expect(estDateOnly('18/05/2026')).toBe(false);
    expect(estDateOnly('2026-5-18')).toBe(false);
    expect(estDateOnly('2026-02-31')).toBe(false);
    expect(estDateOnly('')).toBe(false);
  });

  it('refuse les valeurs non textuelles', () => {
    expect(estDateOnly(undefined)).toBe(false);
    expect(estDateOnly(null)).toBe(false);
    expect(estDateOnly(new Date())).toBe(false);
    expect(estDateOnly(20260518)).toBe(false);
  });
});

describe('@IsDateOnly()', () => {
  const valider = (date: unknown) =>
    validateSync(plainToInstance(Exemple, { date }));

  it('ne produit aucune erreur pour une date calendaire', () => {
    expect(valider('2026-05-18')).toHaveLength(0);
  });

  it('produit un message en français pour une valeur invalide', () => {
    const erreurs = valider('2026-05-18T10:00:00.000Z');
    expect(erreurs).toHaveLength(1);
    expect(Object.values(erreurs[0].constraints ?? {})).toContain(
      'date doit être une date au format AAAA-MM-JJ',
    );
  });
});
