import {
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class PointGPSDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  ordre: number;
}

export class ModifierDelimitationDto {
  @IsNumber()
  superficie: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointGPSDto)
  pointsGPS: PointGPSDto[];
}