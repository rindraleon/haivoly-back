import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { StatutCulture } from '../../common/enums/domain.enums';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

export class PointGPSCultureInputDto {
  @IsNumber()
  @IsLatitude({ message: 'Latitude invalide' })
  latitude: number;

  @IsNumber()
  @IsLongitude({ message: 'Longitude invalide' })
  longitude: number;

  @IsNumber()
  @Min(0)
  ordre: number;
}

export class CreateCultureDto {
  @IsNotEmpty({ message: 'Le nom de la culture est obligatoire' })
  @IsString()
  @MaxLength(120)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  variete?: string;

  /** Date métier sans heure, format strict "AAAA-MM-JJ" (colonne `date`). */
  @IsOptional()
  @IsDateOnly({
    message: 'La date de plantation doit être au format AAAA-MM-JJ',
  })
  datePlantation?: string;

  @IsOptional()
  @IsDateOnly({
    message: 'La date prévue de récolte doit être au format AAAA-MM-JJ',
  })
  datePrevueRecolte?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  stade?: string;

  @IsOptional()
  @IsEnum(StatutCulture, { message: 'Statut de culture invalide' })
  statut?: StatutCulture;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(3, {
    message: 'Une délimitation doit comporter au moins 3 points',
  })
  @ValidateNested({ each: true })
  @Type(() => PointGPSCultureInputDto)
  pointsGPS?: PointGPSCultureInputDto[];
}
