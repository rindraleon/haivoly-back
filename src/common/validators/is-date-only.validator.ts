import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Vrai si `value` est une date calendaire `YYYY-MM-DD` existante. */
export function estDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Décorateur : le champ doit être une date calendaire `YYYY-MM-DD`. */
export function IsDateOnly(options?: ValidationOptions): PropertyDecorator {
  return (object: object, propriete: string | symbol): void => {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName: propriete as string,
      options,
      validator: {
        validate: (value: unknown) => estDateOnly(value),
        defaultMessage: (arguments_?: ValidationArguments) =>
          `${arguments_?.property ?? 'Le champ'} doit être une date au format AAAA-MM-JJ`,
      },
    });
  };
}
