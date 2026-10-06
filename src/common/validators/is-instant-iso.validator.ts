/**
 * Validation stricte des horodatages (`timestamp`) : ils doivent être des
 * instants ISO-8601 complets.
 *
 * Complément de `@IsDateOnly()` : un même champ ne doit jamais pouvoir être
 * interprété de deux façons. Pour une colonne `timestamp`
 * (`Intervention.date`, `Observation.date`), on exige donc
 * `AAAA-MM-JJTHH:mm:ss(.sss)?Z` (ou un décalage explicite `+03:00`) — une
 * simple date calendaire est refusée, car le serveur doit comparer un instant
 * à `now` pour calculer les statuts.
 */
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const INSTANT_ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

/** Vrai si `value` est un instant ISO-8601 complet et réel. */
export function estInstantIso(value: unknown): value is string {
  if (typeof value !== 'string' || !INSTANT_ISO_REGEX.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** Décorateur : le champ doit être un instant ISO-8601 (`...T...Z`). */
export function IsInstantIso(options?: ValidationOptions): PropertyDecorator {
  return (object: object, propriete: string | symbol): void => {
    registerDecorator({
      name: 'isInstantIso',
      target: object.constructor,
      propertyName: propriete as string,
      options,
      validator: {
        validate: (value: unknown) => estInstantIso(value),
        defaultMessage: (arguments_?: ValidationArguments) =>
          `${arguments_?.property ?? 'Le champ'} doit être un instant ISO-8601 (AAAA-MM-JJTHH:mm:ssZ)`,
      },
    });
  };
}
