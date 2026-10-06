import { BeforeInsert, PrimaryColumn } from 'typeorm';
import { randomUUID } from 'crypto';

/**
 * Base commune à toutes les entités.
 *
 * Les identifiants sont persistés en `text` (et non en `uuid`) afin de rester
 * strictement compatibles avec les tables créées historiquement par Prisma.
 * L'UUID est généré côté application (équivalent du `@default(uuid())` Prisma).
 */
export abstract class BaseEntity {
  @PrimaryColumn({ type: 'text', name: 'id' })
  id: string;

  @BeforeInsert()
  protected generateId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
