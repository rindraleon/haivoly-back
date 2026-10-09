import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import {
  StatutIntervention,
  TypeIntervention,
} from '../../common/enums/domain.enums';
import { Culture } from '../../cultures/entities/culture.entity';
import type { PhotoIntervention } from '../../photos-interventions/entities/photo-intervention.entity';

@Entity({ name: 'Intervention' })
export class Intervention extends BaseEntity {
  @Column({ type: 'text' })
  type: TypeIntervention | string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Column({
    type: 'enum',
    enum: StatutIntervention,
    enumName: 'StatutIntervention',
    default: StatutIntervention.EN_COURS,
  })
  statut: StatutIntervention;

  @Column({ type: 'text', nullable: true })
  produit: string | null;

  @Column({ type: 'double precision', nullable: true })
  quantite: number | null;

  @Column({ type: 'text', nullable: true })
  unite: string | null;

  @Column({ type: 'double precision', nullable: true })
  cout: number | null;

  @Index('IDX_Intervention_cultureId')
  @Column({ type: 'text', name: 'cultureId' })
  cultureId: string;

  @ManyToOne(() => Culture, (c) => c.interventions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cultureId' })
  culture: Culture;

  @OneToMany('PhotoIntervention', 'intervention')
  photos: PhotoIntervention[];

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'creeA' })
  creeA: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
