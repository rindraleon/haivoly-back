import { PartialType } from '@nestjs/mapped-types';

import { CreateCultureDto } from './creation-culture.dto';

export class UpdateCultureDto extends PartialType(CreateCultureDto) {}
