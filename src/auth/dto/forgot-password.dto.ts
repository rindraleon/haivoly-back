import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: "L'adresse email est obligatoire" })
  @IsEmail({}, { message: 'Veuillez saisir une adresse email valide' })
  email: string;
}
