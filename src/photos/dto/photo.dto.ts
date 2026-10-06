import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Accepte soit une URL externe (https://...) soit un chemin relatif
 * `/uploads/observations/...` produit par l'endpoint d'upload.
 */
export class CreatePhotoDto {
  @IsNotEmpty({ message: "L'URL de la photo est obligatoire" })
  @IsString()
  @MaxLength(1000)
  url: string;
}

export class UpdatePhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  url?: string;
}
