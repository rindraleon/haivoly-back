import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class PointGPSCultureDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  ordre: number;
}

export class PointsGPSCultureDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointGPSCultureDto)
  points: PointGPSCultureDto[];
}