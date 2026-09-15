import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdatePhotoInterventionDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
