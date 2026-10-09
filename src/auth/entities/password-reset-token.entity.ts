import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Utilisateur } from '../../users/entities/utilisateur.entity';

@Entity({ name: 'PasswordResetToken' })
export class PasswordResetToken extends BaseEntity {
  @Index('PasswordResetToken_email_idx')
  @Column({ type: 'text' })
  email: string;

  @Index('PasswordResetToken_tokenHash_key', { unique: true })
  @Column({ type: 'text', name: 'tokenHash' })
  tokenHash: string;

  @Index('PasswordResetToken_expiresAt_idx')
  @Column({ type: 'timestamp', precision: 3, name: 'expiresAt' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @Column({ type: 'text', name: 'utilisateurId', nullable: true })
  utilisateurId: string | null;

  @ManyToOne(() => Utilisateur, (u) => u.passwordResetTokens, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: Utilisateur | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3, name: 'createdAt' })
  createdAt: Date;
}
