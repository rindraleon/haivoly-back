import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePhotoInterventionDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}