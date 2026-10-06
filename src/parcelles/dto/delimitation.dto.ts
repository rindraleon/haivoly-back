import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PointGPSDto {
  @IsNumber()
  @IsLatitude({ message: 'Latitude invalide' })
  latitude: number;

  @IsNumber()
  @IsLongitude({ message: 'Longitude invalide' })
  longitude: number;

  /**
   * Position du sommet dans le polygone. **Optionnel** : lorsqu'il est omis, le
   * serveur utilise l'ordre du tableau envoyé — le mobile n'a donc pas à
   * numéroter les points (même contrat que la création de parcelle).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ordre?: number;
}

export class AjouterPointsGPSDto {
  @IsArray()
  @ArrayMinSize(3, {
    message: 'Une parcelle doit avoir au moins 3 points GPS.',
  })
  @ValidateNested({ each: true })
  @Type(() => PointGPSDto)
  pointsGPS: PointGPSDto[];
}

export class ModifierDelimitationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  superficie?: number;

  @IsArray()
  @ArrayMinSize(3, {
    message: 'Une parcelle doit avoir au moins 3 points GPS.',
  })
  @ValidateNested({ each: true })
  @Type(() => PointGPSDto)
  pointsGPS: PointGPSDto[];
}

export class SupprimerParcelleDto {
  @IsString()
  @IsNotEmpty({ message: 'La raison de suppression est obligatoire.' })
  raison: string;
}
