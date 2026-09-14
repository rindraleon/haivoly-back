import {
  IsNotEmpty,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePhotoRecolteDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}