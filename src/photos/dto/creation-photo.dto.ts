import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreatePhotoDto {
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
