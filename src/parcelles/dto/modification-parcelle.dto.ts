import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { CreateParcelleDto } from './creation-parcelle.dto';
import { StatutParcelle } from '../../common/enums/domain.enums';

/**
 * Statuts modifiables manuellement. `SUPPRIMEE` est exclu : la suppression
 * passe obligatoirement par DELETE /parcelles/:id (avec motif).
 */
export enum StatutParcelleModifiable {
  ACTIVE = 'ACTIVE',
  ABANDONNEE = 'ABANDONNEE',
  ARCHIVEE = 'ARCHIVEE',
}

export class UpdateParcelleDto extends PartialType(CreateParcelleDto) {
  @IsOptional()
  @IsEnum(StatutParcelleModifiable, {
    message: 'Statut de parcelle invalide',
  })
  statut?: StatutParcelleModifiable;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  raisonSuppression?: string;

  static readonly toDomain = (
    statut: StatutParcelleModifiable,
  ): StatutParcelle => statut as unknown as StatutParcelle;
}
