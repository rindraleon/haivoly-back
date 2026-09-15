import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateParcelleDto } from './creation-parcelle.dto';

export enum StatutParcelleDto {
  ACTIVE = 'ACTIVE',
  ABANDONNEE = 'ABANDONNEE',
  ARCHIVEE = 'ARCHIVEE',
}

export class UpdateParcelleDto extends PartialType(CreateParcelleDto) {
  @IsOptional()
  @IsEnum(StatutParcelleDto)
  statut?: StatutParcelleDto;
}
