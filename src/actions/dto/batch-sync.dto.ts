import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateActionDto } from './create-action.dto';

export class BatchSyncDto {
  @IsArray()
  @ArrayMaxSize(200, {
    message: 'Un lot de synchronisation ne peut pas dépasser 200 actions',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions: CreateActionDto[];
}

/**
 * Payload canonique de POST /sync.
 * `deviceId` identifie l'appareil, `lastSync` permet de ne récupérer que les
 * changements serveur postérieurs.
 */
export class SyncDto extends BatchSyncDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'lastSync doit être un instant ISO-8601' })
  lastSync?: string;
}
