import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';

@Entity('dress_collections')
export class DressCollection extends BaseModel {
  @Column({ type: 'int', name: 'amount' })
  amount?: number;

  @Column({ name: 'collect_date', type: 'date' })
  collectDate?: Date;

  @Column({ type: 'date' })
  deadline?: Date;

  @Column({ name: 'is_collected', type: 'boolean' })
  isCollected?: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;
}