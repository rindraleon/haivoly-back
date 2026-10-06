import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export class CreateRecolteDto {
  /** Date de récolte sans heure, format strict "AAAA-MM-JJ" (colonne `date`). */
  @IsDateOnly({ message: 'La date de récolte doit être au format AAAA-MM-JJ' })
  dateRecolte: string;

  @IsNumber()
  @Min(0.01, { message: 'La quantité doit être supérieure à 0' })
  quantite: number;

  @IsString()
  @IsNotEmpty({ message: 'L’unité est obligatoire' })
  @MaxLength(30)
  unite: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prixVente?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coutRecolte?: number;
}

export class UpdateRecolteDto {
  @IsOptional()
  @IsDateOnly({ message: 'La date de récolte doit être au format AAAA-MM-JJ' })
  dateRecolte?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantite?: number;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prixVente?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coutRecolte?: number;
}
