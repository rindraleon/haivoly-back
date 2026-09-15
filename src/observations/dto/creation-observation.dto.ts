import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateObservationDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
