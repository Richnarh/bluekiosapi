import { Entity, Column, JoinColumn, ManyToOne, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.js';
import { FormType } from '../models/model.js';

@Entity({ name: "forms" })
export class Form{
  @PrimaryColumn('varchar', { length: 255, nullable: false  })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ name: 'token', type: 'text'})
  token?: string;

  @Column({ name: 'url', type: 'text',})
  url?: string;

  @Column({ name: 'form_type', type: 'enum', enum: FormType })
  formType?: FormType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user?: User;

  @Column({ name: 'expires_at', type: 'date' })
  expiresAt?: Date;

  @Column({ name: 'short_id', type: 'varchar', nullable: true, unique: true })
  shortId?: string;

  @Column({ name: 'short_url', type: 'varchar', nullable: true })
  shortUrl?: string;
}