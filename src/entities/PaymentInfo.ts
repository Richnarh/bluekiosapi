import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { PaymentMethod, PaymentStatus } from '../models/enums.js';
import { Customer } from './Customer.js';
import { Reference } from './Reference.js';

@Entity('payment_infos')
export class PaymentInfo extends BaseModel {
@Column({ name: 'amount_paid', type: 'double precision' })
  amountPaid?: number;

  @Column({ name: 'expected_amount', type: 'double precision', nullable: true })
  expectedAmount?: number;

  @Column({ name: 'amount_remaining', type: 'double precision', nullable: true })
  amountRemaining?: number;

  @Column({ type: 'date', nullable: true })
  date?: Date;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, nullable: true })
  paymentStatus?: PaymentStatus;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id'  })
  user?: User;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId', referencedColumnName: 'id' })
  customer?: Customer;

  @ManyToOne(() => Reference)
  @JoinColumn({ name: 'referenceId', referencedColumnName: 'id' })
  reference?: Reference;
}