import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Culture } from '../../cultures/entities/culture.entity';
import type { PhotoRecolte } from '../../photos-recoltes/entities/photo-recolte.entity';

@Entity({ name: 'Recolte' })
export class Recolte extends BaseEntity {
  @Column({ type: 'date', name: 'dateRecolte' })
  dateRecolte: string;

  @Column({ type: 'double precision' })
  quantite: number;

  @Column({ type: 'text' })
  unite: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'double precision', name: 'prixVente', nullable: true })
  prixVente: number | null;

  @Column({ type: 'double precision', name: 'coutRecolte', nullable: true })
  coutRecolte: number | null;

  /** Relation 1–1 : une culture ne peut avoir qu'une seule récolte. */
  @Column({ type: 'text', name: 'cultureId', unique: true })
  cultureId: string;

  @OneToOne(() => Culture, (c) => c.recolte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cultureId' })
  culture: Culture;

  @OneToMany('PhotoRecolte', 'recolte')
  photos: PhotoRecolte[];

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'creeA' })
  creeA: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
