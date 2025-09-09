import { Column, BaseEntity, CreateDateColumn, UpdateDateColumn, PrimaryColumn, BeforeInsert } from 'typeorm';
import { ulid } from "ulid";

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn('varchar', { length: 255, nullable: false  })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ name: 'added_by', type: 'varchar', length: 255, nullable: true })
  addedBy?: string;

  @BeforeInsert()
  generateId() {
      this.id = ulid();
  }
}