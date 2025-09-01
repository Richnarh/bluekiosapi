import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { Reference } from './Reference.js';
import { MaleMeasurement } from './MaleMeasurement.js';

@Entity('male_details')
export class MaleDetails extends BaseModel {
@Column({ name: 'measured_value', type: 'decimal', precision: 10, scale: 2 })
  measuredValue?: number;

  @ManyToOne(() => User, (user) => user.maleDetails)
  @JoinColumn({ name: 'users' })
  user?: User;

  @ManyToOne(() => Customer, (customer) => customer.maleDetails)
  @JoinColumn({ name: 'customers' })
  customer?: Customer;

  @ManyToOne(() => MaleMeasurement, (maleMeasurement) => maleMeasurement.customerDetails)
  @JoinColumn({ name: 'male_measurements', referencedColumnName: 'id' })
  maleMeasurement?: MaleMeasurement;

  @ManyToOne(() => Reference, (reference) => reference.maleDetails)
  @JoinColumn({ name: 'references', referencedColumnName: 'id' })
  reference?: Reference;

  maleMeasurementId?:string;
  referenceId?:string;
}