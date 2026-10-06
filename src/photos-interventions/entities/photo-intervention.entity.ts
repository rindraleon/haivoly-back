import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Intervention } from '../../interventions/entities/intervention.entity';

@Entity({ name: 'PhotoIntervention' })
export class PhotoIntervention extends BaseEntity {
  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'dateAjout' })
  dateAjout: Date;

  @Index('IDX_PhotoIntervention_interventionId')
  @Column({ type: 'text', name: 'interventionId' })
  interventionId: string;

  @ManyToOne(() => Intervention, (i) => i.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interventionId' })
  intervention: Intervention;
}
