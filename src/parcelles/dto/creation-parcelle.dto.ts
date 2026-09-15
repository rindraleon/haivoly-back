import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateParcelleDto {
  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  superficie?: number;

  @IsOptional()
  @IsString()
  typeSol?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
