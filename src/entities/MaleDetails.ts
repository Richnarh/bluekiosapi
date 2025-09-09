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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @ManyToOne(() => MaleMeasurement)
  @JoinColumn({ name: 'male_measurementId', referencedColumnName: 'id' })
  maleMeasurement?: MaleMeasurement;

  @ManyToOne(() => Reference)
  @JoinColumn({ name: 'referenceId', referencedColumnName: 'id' })
  reference?: Reference;

  maleMeasurementId?:string;
  referenceId?:string;
}