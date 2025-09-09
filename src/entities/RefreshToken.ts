import { Column, Entity, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';

@Entity('refresh_token')
export class RefreshToken extends BaseModel {
  @Column({ name: 'token', type: 'varchar', length: 255, unique: true })
  token?: string;

  @Column({ name: 'expires_at', type: 'date' })
  expiresAt?: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}