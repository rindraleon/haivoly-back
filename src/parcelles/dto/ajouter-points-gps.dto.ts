import { IsArray, IsNumber, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class PointGPSDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  ordre: number;
}

export class AjouterPointsGPSDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointGPSDto)
  pointsGPS: PointGPSDto[];
}
