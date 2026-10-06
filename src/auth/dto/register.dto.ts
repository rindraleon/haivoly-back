import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
