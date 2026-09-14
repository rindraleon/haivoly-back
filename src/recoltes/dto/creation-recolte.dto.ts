import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRecolteDto {
  @IsDateString()
  dateRecolte: string;

  @IsNumber()
  @Min(0.01)
  quantite: number;

  @IsString()
  unite: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prixVente?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coutRecolte?: number;

  @IsOptional()
  @IsString()
  photo?: string;
}