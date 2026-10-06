import { IsOptional, IsString } from 'class-validator';

export class UpdatePhotoInterventionDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}