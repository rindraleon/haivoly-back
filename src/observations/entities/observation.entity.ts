import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Culture } from '../../cultures/entities/culture.entity';
import type { Photo } from '../../photos/entities/photo.entity';

@Entity({ name: 'Observation' })
export class Observation extends BaseEntity {
  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Index('IDX_Observation_cultureId')
  @Column({ type: 'text', name: 'cultureId' })
  cultureId: string;

  @ManyToOne(() => Culture, (c) => c.observations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cultureId' })
  culture: Culture;

  @OneToMany('Photo', 'observation')
  photos: Photo[];

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
