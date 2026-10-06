import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import {
  RecommendationPriority,
  RecommendationType,
} from '../../common/enums/domain.enums';
import { Utilisateur } from '../../users/entities/utilisateur.entity';

@Entity({ name: 'Recommendation' })
export class Recommendation extends BaseEntity {
  @Index('Recommendation_userId_idx')
  @Column({ type: 'text', name: 'userId' })
  userId: string;

  @ManyToOne(() => Utilisateur, (u) => u.recommendations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  utilisateur: Utilisateur;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Index('Recommendation_type_idx')
  @Column({ type: 'text', default: RecommendationType.INFO })
  type: string;

  @Index('Recommendation_priority_idx')
  @Column({ type: 'text', default: RecommendationPriority.MEDIUM })
  priority: string;

  @Column({ type: 'timestamp', precision: 3, name: 'readAt', nullable: true })
  readAt: Date | null;

  @Column({
    type: 'timestamp',
    precision: 3,
    name: 'expiresAt',
    nullable: true,
  })
  expiresAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Index('Recommendation_createdAt_idx')
  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt: Date;
}
