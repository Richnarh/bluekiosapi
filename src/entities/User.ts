import { Column, Entity } from 'typeorm';
import { BaseModel } from './BaseModel.js';

@Entity({ name: 'users' })
export class User extends BaseModel {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 100, unique: true })
  phoneNumber?: string;

  @Column({ name: 'email_address', type: 'varchar', length: 255, unique: true, nullable: true })
  emailAddress?: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified?: boolean;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username?: string;
}