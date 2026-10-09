import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { IsInstantIso } from '../../common/validators/is-instant-iso.validator';

import { ALL_INTERVENTION_TYPES } from '../../common/enums/domain.enums';

export class CreateInterventionDto {
  @IsNotEmpty({ message: 'Le type d’intervention est obligatoire' })
  @IsIn(ALL_INTERVENTION_TYPES, {
    message:
      'Type d’intervention invalide (PLANTATION, IRRIGATION, FERTILISATION, DESHERBAGE, TRAITEMENT, ENTRETIEN, INSPECTION, AUTRE)',
  })
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInstantIso({
    message: 'La date de l’intervention doit être un instant ISO-8601',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  produit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantite?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;
}

export class UpdateInterventionDto {
  @IsOptional()
  @IsIn(ALL_INTERVENTION_TYPES, { message: 'Type d’intervention invalide' })
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Date + heure **ISO-8601** (instant). Le statut est recalculé côté serveur. */
  @IsOptional()
  @IsInstantIso({
    message: 'La date de l’intervention doit être un instant ISO-8601',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  produit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantite?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;
}
