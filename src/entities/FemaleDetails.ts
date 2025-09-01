import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { FemaleMeasurement } from './FemaleMeasurement.js';
import { Reference } from './Reference.js';

@Entity('female_details')
export class FemaleDetails extends BaseModel {
@Column({ name: 'measured_value', type: 'decimal', precision: 10, scale: 2 })
  measuredValue?: number;

  @ManyToOne(() => User, (user) => user.femaleDetails)
  @JoinColumn({ name: 'users' })
  user?: User;

  @ManyToOne(() => Customer, (customer) => customer.femaleDetails)
  @JoinColumn({ name: 'customers' })
  customer?: Customer;

  @ManyToOne(() => FemaleMeasurement, (femaleMeasurement) => femaleMeasurement.customerDetails)
  @JoinColumn({ name: 'female_measurements', referencedColumnName: 'id'  })
  femaleMeasurement?: FemaleMeasurement;

  @ManyToOne(() => Reference, (reference) => reference.femaleDetails)
  @JoinColumn({ name: 'references', referencedColumnName: 'id'  })
  reference?: Reference;

  femaleMeasurementId?:string;
  referenceId?:string;
}