import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Parcelle } from '../../parcelles/entities/parcelle.entity';

@Entity({ name: 'PointGPS' })
@Unique('PointGPS_parcelleId_ordre_key', ['parcelleId', 'ordre'])
export class PointGPS extends BaseEntity {
  @Column({ type: 'integer' })
  ordre: number;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ type: 'text', name: 'parcelleId' })
  parcelleId: string;

  @ManyToOne(() => Parcelle, (p) => p.pointsGPS, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcelleId' })
  parcelle: Parcelle;

  // Colonnes historiquement migrées en TIMESTAMPTZ(3)
  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'creeA' })
  creeA: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
