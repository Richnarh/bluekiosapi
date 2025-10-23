import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';

@Entity('customers')
export class Customer extends BaseModel {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 100 })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable:true })
  address?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}