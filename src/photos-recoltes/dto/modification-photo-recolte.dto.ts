import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdatePhotoRecolteDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
