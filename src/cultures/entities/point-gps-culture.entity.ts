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
import { Culture } from './culture.entity';

@Entity({ name: 'PointGPSCulture' })
@Unique('PointGPSCulture_cultureId_ordre_key', ['cultureId', 'ordre'])
export class PointGPSCulture extends BaseEntity {
  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ type: 'integer' })
  ordre: number;

  @Column({ type: 'text', name: 'cultureId' })
  cultureId: string;

  @ManyToOne(() => Culture, (c) => c.pointsGPS, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cultureId' })
  culture: Culture;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'creeA' })
  creeA: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
