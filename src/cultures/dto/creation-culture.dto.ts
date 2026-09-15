import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { StatutCulture } from '@prisma/client';

export class CreateCultureDto {
  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  variete?: string;

  @IsOptional()
  @IsDateString()
  datePlantation?: string;

  @IsOptional()
  @IsDateString()
  datePrevueRecolte?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  stade?: string;

  @IsOptional()
  @IsEnum(StatutCulture)
  statut?: StatutCulture;
}
