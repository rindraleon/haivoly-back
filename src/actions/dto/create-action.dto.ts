import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ENTITY_TYPES = [
  'PARCELLE',
  'POINT_GPS',
  'CULTURE',
  'INTERVENTION',
  'OBSERVATION',
  'PHOTO',
  'RECOLTE',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export class CreateActionDto {
  /** Identifiant unique généré par le mobile — clé d'idempotence. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;

  @IsNotEmpty()
  @IsIn(ACTION_TYPES, { message: 'actionType doit être CREATE/UPDATE/DELETE' })
  actionType: ActionType;

  @IsNotEmpty()
  @IsIn(ENTITY_TYPES, { message: 'entityType invalide' })
  entityType: EntityType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
