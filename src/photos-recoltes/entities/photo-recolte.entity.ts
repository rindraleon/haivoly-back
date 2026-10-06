import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Recolte } from '../../recoltes/entities/recolte.entity';

@Entity({ name: 'PhotoRecolte' })
export class PhotoRecolte extends BaseEntity {
  @Column({ type: 'text' })
  url: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'dateAjout' })
  dateAjout: Date;

  @Index('IDX_PhotoRecolte_recolteId')
  @Column({ type: 'text', name: 'recolteId' })
  recolteId: string;

  @ManyToOne(() => Recolte, (r) => r.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recolteId' })
  recolte: Recolte;
}
