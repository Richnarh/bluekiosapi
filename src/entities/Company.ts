import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { Region } from '../models/enums.js';
import { User } from './User.js';

@Entity('company')
export class Company extends BaseModel {
  @Column({ name: 'company_name', type: 'varchar', length: 255, unique: true })
  companyName?: string;

  @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ name: 'quote', type: 'varchar', length: 255, nullable: true })
  quote?: string;

  @Column({ type: 'enum', enum: Region, name: 'region', nullable: true })
  region?: Region;

  @Column({ type: 'text', name: 'logo', nullable: true })
  logo?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}