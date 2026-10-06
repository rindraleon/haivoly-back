import type { ValidationError } from '@nestjs/common';

import { champsInvalides } from './validation-errors';
import { ErrorCode } from '../errors/error-codes';

/** Construit une erreur de validation comme le fait `class-validator`. */
function erreur(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
  value?: unknown,
): ValidationError {
  return { property, ...(constraints ? { constraints } : {}), children, value };
}

describe('champsInvalides — indexation des erreurs de validation', () => {
  it('indexe un champ simple', () => {
    const champs = champsInvalides([
      erreur('email', { isEmail: 'Email invalide' }, undefined, 'pas-un-email'),
    ]);

    expect(champs).toEqual([
      {
        field: 'email',
        path: ['email'],
        code: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'Email invalide',
        value: 'pas-un-email',
      },
    ]);
  });

  it('indexe un tableau d’objets (pointsGPS[1].latitude)', () => {
    const champs = champsInvalides([
      erreur('pointsGPS', undefined, [
        erreur('1', undefined, [
          erreur('latitude', { isNumber: 'La latitude doit être un nombre' }),
        ]),
      ]),
    ]);

    expect(champs).toHaveLength(1);
    expect(champs[0].field).toBe('pointsGPS.1.latitude');
    expect(champs[0].path).toEqual(['pointsGPS', 1, 'latitude']);
    expect(champs[0].message).toBe('La latitude doit être un nombre');
  });

  it('indexe une structure imbriquée (formations.1.nom)', () => {
    const champs = champsInvalides([
      erreur('formations', undefined, [
        erreur('1', undefined, [
          erreur('nom', { isNotEmpty: 'Le nom est obligatoire' }),
        ]),
      ]),
    ]);

    expect(champs[0].field).toBe('formations.1.nom');
    expect(champs[0].path).toEqual(['formations', 1, 'nom']);
    expect(champs[0].code).toBe(ErrorCode.VALIDATION_REQUIRED);
  });

  it('ne conserve que la première contrainte par champ', () => {
    const champs = champsInvalides([
      erreur('nom', {
        isNotEmpty: 'Le nom est obligatoire',
        minLength: 'Trop court',
      }),
    ]);

    expect(champs).toHaveLength(1);
    expect(champs[0].message).toBe('Le nom est obligatoire');
  });

  it('signale une propriété inconnue (whitelist)', () => {
    const champs = champsInvalides([
      erreur('champInconnu', {
        whitelistValidation: 'property champInconnu should not exist',
      }),
    ]);

    expect(champs[0].code).toBe(ErrorCode.UNKNOWN_FIELD);
    expect(champs[0].field).toBe('champInconnu');
  });

  it('résume une valeur trop longue et n’expose pas les objets', () => {
    const champs = champsInvalides([
      erreur(
        'description',
        { maxLength: 'Trop long' },
        undefined,
        'x'.repeat(500),
      ),
      erreur('objet', { isString: 'Doit être une chaîne' }, undefined, {
        a: 1,
      }),
    ]);

    expect(String(champs[0].value)).toHaveLength(121); // 120 caractères + ellipse
    expect(champs[1].value).toBeUndefined();
  });

  it('conserve plusieurs champs indépendants', () => {
    const champs = champsInvalides([
      erreur('email', { isEmail: 'Email invalide' }),
      erreur('telephone', { matches: 'Téléphone invalide' }),
    ]);

    expect(champs.map((champ) => champ.field)).toEqual(['email', 'telephone']);
  });
});
