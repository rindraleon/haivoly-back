import { PartialType } from '@nestjs/mapped-types';
import { CreateObservationDto } from './creation-observation.dto';

export class UpdateObservationDto extends PartialType(CreateObservationDto) {}
