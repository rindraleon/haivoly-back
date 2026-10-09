import { BeforeInsert, PrimaryColumn } from 'typeorm';
import { randomUUID } from 'crypto';

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
