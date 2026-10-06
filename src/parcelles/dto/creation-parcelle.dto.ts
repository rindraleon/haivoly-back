import { Type } from 'class-transformer';
import {
  IsArray,
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

export class PointGPSInputDto {
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;

  /**
   * Position du sommet dans le polygone. **Optionnel** : lorsqu'il est omis,
   * le serveur utilise l'ordre du tableau envoyé (contrat plus simple pour le
   * mobile, qui n'a pas à numéroter les points).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ordre?: number;
}

export class CreateParcelleDto {
  @IsNotEmpty({ message: 'Le nom de la parcelle est obligatoire' })
  @IsString()
  @MaxLength(120)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  superficie?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  typeSol?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude({ message: 'La latitude doit être comprise entre -90 et 90' })
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude({ message: 'La longitude doit être comprise entre -180 et 180' })
  longitude?: number;

  /** Délimitation optionnelle fournie dès la création (wizard mobile). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointGPSInputDto)
  pointsGPS?: PointGPSInputDto[];
}
