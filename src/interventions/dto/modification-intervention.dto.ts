import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInterventionDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  produit?: string;

  @IsOptional()
  @IsNumber()
  quantite?: number;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsNumber()
  cout?: number;
}
