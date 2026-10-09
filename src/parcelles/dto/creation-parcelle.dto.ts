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
