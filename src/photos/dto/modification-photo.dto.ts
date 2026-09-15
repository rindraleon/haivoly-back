import { PartialType } from '@nestjs/mapped-types';
import { CreatePhotoDto } from './creation-photo.dto';

export class UpdatePhotoDto extends PartialType(CreatePhotoDto) {}
