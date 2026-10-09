import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { StatutCulture } from '../../common/enums/domain.enums';
import { Parcelle } from '../../parcelles/entities/parcelle.entity';
import type { Intervention } from '../../interventions/entities/intervention.entity';
import type { Observation } from '../../observations/entities/observation.entity';
import type { PointGPSCulture } from './point-gps-culture.entity';
import type { Recolte } from '../../recoltes/entities/recolte.entity';

@Entity({ name: 'Culture' })
export class Culture extends BaseEntity {
  @Column({ type: 'text' })
  nom: string;

  @Column({ type: 'text', nullable: true })
  type: string | null;

  @Column({ type: 'text', nullable: true })
  variete: string | null;

  @Column({ type: 'date', name: 'datePlantation', nullable: true })
  datePlantation: string | null;

  @Column({ type: 'date', name: 'datePrevueRecolte', nullable: true })
  datePrevueRecolte: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  stade: string | null;

  @Column({
    type: 'enum',
    enum: StatutCulture,
    enumName: 'StatutCulture',
    default: StatutCulture.PLANIFIEE,
  })
  statut: StatutCulture;

  @Column({ type: 'text', name: 'raisonSuppression', nullable: true })
  raisonSuppression: string | null;

  @Index('IDX_Culture_parcelleId')
  @Column({ type: 'text', name: 'parcelleId' })
  parcelleId: string;

  @ManyToOne(() => Parcelle, (p) => p.cultures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcelleId' })
  parcelle: Parcelle;

  @OneToMany('Intervention', 'culture')
  interventions: Intervention[];

  @OneToMany('Observation', 'culture')
  observations: Observation[];

  @OneToMany('PointGPSCulture', 'culture')
  pointsGPS: PointGPSCulture[];

  @OneToOne('Recolte', 'culture')
  recolte: Recolte | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'creeA' })
  creeA: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3, name: 'modifieA' })
  modifieA: Date;
}
