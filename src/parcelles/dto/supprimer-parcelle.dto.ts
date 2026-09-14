import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class SupprimerParcelleDto {
  @IsString()
  @IsNotEmpty()
  raison: string;
}