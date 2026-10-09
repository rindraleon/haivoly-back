import {
  codeDeContrainte,
  estMessageParDefaut,
  messageChamp,
} from './messages-validation';

describe('estMessageParDefaut', () => {
  it('reconnaît un message généré par class-validator', () => {
    expect(
      estMessageParDefaut(
        'latitude must be a latitude string or number',
        'latitude',
      ),
    ).toBe(true);
    expect(
      estMessageParDefaut(
        'each value in pointsGPS must be an object',
        'pointsGPS',
      ),
    ).toBe(true);
  });

  it('ne touche pas à un message rédigé dans le DTO', () => {
    expect(
      estMessageParDefaut('Le nom de la parcelle est obligatoire', 'nom'),
    ).toBe(false);
    expect(
      estMessageParDefaut(
        'Date invalide (format attendu : AAAA-MM-JJ).',
        'date',
      ),
    ).toBe(false);
  });
});

describe('messageChamp', () => {
  it('traduit les contraintes techniques sans message de DTO', () => {
    expect(
      messageChamp(
        'isLatitude',
        'latitude',
        'latitude must be a latitude string or number',
      ),
    ).toBe('Latitude invalide (entre -90 et 90).');
    expect(messageChamp('isNotEmpty', 'nom', 'nom should not be empty')).toBe(
      'Ce champ est obligatoire.',
    );
    expect(
      messageChamp('isNumber', 'quantite', 'quantite must be a number'),
    ).toBe('Ce champ doit être un nombre.');
    expect(
      messageChamp(
        'isIn',
        'type',
        'type must be one of the following values: X',
      ),
    ).toBe('Valeur non autorisée.');
  });

  it('conserve le message métier du DTO', () => {
    expect(
      messageChamp(
        'isNotEmpty',
        'nom',
        'Le nom de la parcelle est obligatoire',
      ),
    ).toBe('Le nom de la parcelle est obligatoire');
  });

  it('ne renvoie jamais de texte anglais, même pour une contrainte inconnue', () => {
    const message = messageChamp('isFantaisie', 'champ', 'champ is weird');
    expect(message).toBe('Valeur invalide.');
    expect(message).not.toMatch(/\bmust\b|\bshould\b|\brequired\b/i);
  });
});

describe('codeDeContrainte', () => {
  it('associe un code exploitable à chaque famille de contrainte', () => {
    expect(codeDeContrainte('isNotEmpty')).toBe('VALIDATION_REQUIRED');
    expect(codeDeContrainte('whitelistValidation')).toBe(
      'VALIDATION_UNKNOWN_FIELD',
    );
    expect(codeDeContrainte('isLatitude')).toBe('VALIDATION_INVALID_FORMAT');
    expect(codeDeContrainte('maxLength')).toBe('VALIDATION_INVALID_VALUE');
    expect(codeDeContrainte('isInstantIso')).toBe('VALIDATION_INVALID_FORMAT');
  });
});
