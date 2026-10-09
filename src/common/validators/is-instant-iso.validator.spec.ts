import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { IsInstantIso, estInstantIso } from './is-instant-iso.validator';

class Exemple {
  @IsInstantIso()
  date?: string;
}

describe('estInstantIso', () => {
  it('accepte un instant ISO-8601 UTC', () => {
    expect(estInstantIso('2026-05-18T06:00:00.000Z')).toBe(true);
    expect(estInstantIso('2026-05-18T06:00:00Z')).toBe(true);
    expect(estInstantIso('2026-05-18T06:00Z')).toBe(true);
  });

  it('accepte un décalage horaire explicite', () => {
    expect(estInstantIso('2026-05-18T09:00:00+03:00')).toBe(true);
  });

  it('refuse une date calendaire seule', () => {
    expect(estInstantIso('2026-05-18')).toBe(false);
  });

  it('refuse les instants impossibles', () => {
    expect(estInstantIso('2026-13-40T00:00:00Z')).toBe(false);
    expect(estInstantIso('2026-05-18T06:00:00')).toBe(false); // pas de fuseau
    expect(estInstantIso('')).toBe(false);
    expect(estInstantIso(1_768_000_000_000)).toBe(false);
  });
});

describe('@IsInstantIso()', () => {
  const valider = (date: unknown) =>
    validateSync(plainToInstance(Exemple, { date }));

  it('accepte un instant', () => {
    expect(valider('2026-05-18T06:00:00.000Z')).toHaveLength(0);
  });

  it('rejette une date sans heure avec un message explicite', () => {
    const erreurs = valider('2026-05-18');
    expect(erreurs).toHaveLength(1);
    expect(Object.values(erreurs[0].constraints ?? {})).toContain(
      'date doit être un instant ISO-8601 (AAAA-MM-JJTHH:mm:ssZ)',
    );
  });
});
