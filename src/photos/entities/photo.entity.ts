import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Observation } from '../../observations/entities/observation.entity';

@Entity({ name: 'Photo' })
export class Photo extends BaseEntity {
  @Column({ type: 'text' })
  url: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'dateAjout' })
  dateAjout: Date;

  @Index('IDX_Photo_observationId')
  @Column({ type: 'text', name: 'observationId' })
  observationId: string;

  @ManyToOne(() => Observation, (o) => o.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'observationId' })
  observation: Observation;
}
