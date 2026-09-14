import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePhotoInterventionDto {
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}