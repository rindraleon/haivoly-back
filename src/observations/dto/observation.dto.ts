import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { IsInstantIso } from '../../common/validators/is-instant-iso.validator';

export class CreateObservationDto {
  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsInstantIso({
    message: 'La date de l’observation doit être un instant ISO-8601',
  })
  date?: string;
}

export class UpdateObservationDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInstantIso({
    message: 'La date de l’observation doit être un instant ISO-8601',
  })
  date?: string;
}
