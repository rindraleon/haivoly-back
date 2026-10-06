import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhotoInterventionDto {
  @IsNotEmpty({ message: "L'URL de la photo est obligatoire" })
  @IsString()
  @MaxLength(1000)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class UpdatePhotoInterventionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
