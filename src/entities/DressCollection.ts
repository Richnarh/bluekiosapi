import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';

@Entity('dress_collections')
export class DressCollection extends BaseModel {
// @Column({ name: 'customer_id', type: 'varchar', length: 255 })
//   customerId: string;

  @Column({ type: 'int', name: 'amount' })
  amount?: number;

  @Column({ name: 'collect_date', type: 'date' })
  collectDate?: Date;

  @Column({ type: 'date' })
  deadline?: Date;

  @Column({ name: 'is_collected', type: 'boolean' })
  isCollected?: boolean;

//   @Column({ name: 'user_id', type: 'varchar', length: 255 })
//   userId: string;

  @ManyToOne(() => User, (user) => user.dressCollection)
  @JoinColumn({ name: 'users' })
  user?: User;

  @ManyToOne(() => Customer, (customer) => customer.dressCollection)
  @JoinColumn({ name: 'customers' })
  customer?: Customer;
}