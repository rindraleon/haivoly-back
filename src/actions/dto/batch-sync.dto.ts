import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateActionDto } from './create-action.dto';

export class BatchSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions: CreateActionDto[];
}
