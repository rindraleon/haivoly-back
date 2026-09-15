import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Le token est obligatoire' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'Le nouveau mot de passe est obligatoire' })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'La confirmation du mot de passe est obligatoire' })
  @IsString()
  confirmPassword: string;
}
