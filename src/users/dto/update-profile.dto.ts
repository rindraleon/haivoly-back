import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(80)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  prenom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;
}
