import { PartialType } from '@nestjs/mapped-types';
import { CreateRecolteDto } from './creation-recolte.dto';

export class UpdateRecolteDto extends PartialType(
  CreateRecolteDto,
) {}