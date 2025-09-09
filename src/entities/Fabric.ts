import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { Reference } from './Reference.js';

@Entity('fabrics')
export class Fabric extends BaseModel {
  @Column({ name: 'fabric_name', type: 'varchar', length: 100, nullable: true })
  fabricName?: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  completedDate?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user?: User;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId', referencedColumnName: 'id' })
  customer?: Customer;

  @ManyToOne(() => Reference)
  @JoinColumn({ name: 'referenceId', referencedColumnName: 'id' })
  reference?: Reference;
}