import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ParcelleSyncDto {
  @IsUUID()
  id: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  superficie?: number;

  @IsOptional()
  @IsString()
  typeSol?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CultureSyncDto {
  @IsUUID()
  id: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  datePlantation?: string;

  @IsOptional()
  @IsString()
  stade?: string;

  @IsUUID()
  parcelleId: string;
}

export class InterventionSyncDto {
  @IsUUID()
  id: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsUUID()
  cultureId: string;
}

export class ObservationSyncDto {
  @IsUUID()
  id: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsUUID()
  cultureId: string;
}

export class PhotoSyncDto {
  @IsUUID()
  id: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsDateString()
  dateAjout?: string;

  @IsUUID()
  observationId: string;
}

export class PointGPSSyncDto {
  @IsUUID()
  id: string;

  @IsNumber()
  ordre: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsUUID()
  parcelleId: string;
}

export class SyncDto {
  @IsOptional()
  @IsDateString()
  lastSync?: string;

  @IsOptional()
  @IsArray()
  parcelles?: ParcelleSyncDto[];

  @IsOptional()
  @IsArray()
  cultures?: CultureSyncDto[];

  @IsOptional()
  @IsArray()
  interventions?: InterventionSyncDto[];

  @IsOptional()
  @IsArray()
  observations?: ObservationSyncDto[];

  @IsOptional()
  @IsArray()
  photos?: PhotoSyncDto[];

  @IsOptional()
  @IsArray()
  pointsGPS?: PointGPSSyncDto[];
}