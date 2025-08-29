import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';

@Entity('otp')
export class Otp extends BaseModel {
  @Column({ type: 'varchar', length: 255, unique: true })
  code?: string;

  @Column({ name: 'expires_at', type: 'date' })
  expiresAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users' })
  user?: User;
}