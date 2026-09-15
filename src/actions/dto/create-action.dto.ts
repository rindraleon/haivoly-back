import { IsOptional, IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateActionDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsNotEmpty()
  @IsString()
  actionType: string;

  @IsNotEmpty()
  @IsString()
  entityType: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
