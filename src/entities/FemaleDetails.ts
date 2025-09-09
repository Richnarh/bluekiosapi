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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @ManyToOne(() => FemaleMeasurement)
  @JoinColumn({ name: 'female_measurementId', referencedColumnName: 'id'  })
  femaleMeasurement?: FemaleMeasurement;

  @ManyToOne(() => Reference)
  @JoinColumn({ name: 'referenceId', referencedColumnName: 'id'  })
  reference?: Reference;

  femaleMeasurementId?:string;
  referenceId?:string;
}