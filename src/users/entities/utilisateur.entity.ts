import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/domain.enums';
import type { Parcelle } from '../../parcelles/entities/parcelle.entity';
import type { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import type { Action } from '../../actions/entities/action.entity';
import type { Recommendation } from '../../recommendations/entities/recommendation.entity';

@Entity({ name: 'Utilisateur' })
export class Utilisateur extends BaseEntity {
  @Column({ type: 'text' })
  nom: string;

  @Column({ type: 'text', nullable: true })
  prenom: string | null;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  telephone: string | null;

  /** Hash bcrypt — ne jamais exposer dans une réponse API. */
  @Column({ type: 'text' })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    enumName: 'Role',
    default: Role.AGRICULTEUR,
  })
  role: Role;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3,
    name: 'creeA',
  })
  creeA: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 3,
    name: 'modifieA',
  })
  modifieA: Date;

  @OneToMany('Parcelle', 'utilisateur')
  parcelles: Parcelle[];

  @OneToMany('PasswordResetToken', 'utilisateur')
  passwordResetTokens: PasswordResetToken[];

  @OneToMany('Action', 'utilisateur')
  actions: Action[];

  @OneToMany('Recommendation', 'utilisateur')
  recommendations: Recommendation[];
}
