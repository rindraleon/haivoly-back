import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhotoRecolteDto {
  @IsNotEmpty({ message: "L'URL de la photo est obligatoire" })
  @IsString()
  @MaxLength(1000)
  url: string;
}

export class UpdatePhotoRecolteDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  url?: string;
}
