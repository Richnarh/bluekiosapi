import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { MeasureType } from './enums.js';
import { MaleDetails } from './MaleDetails.js';
import { FemaleDetails } from './FemaleDetails.js';

@Entity('female_measurements')
export class FemaleMeasurement extends BaseModel {
//   @Column({ name: 'user_id', type: 'varchar', length: 255 })
//   userId: string;

  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column({ name: 'measure_type', type: 'enum', enum: MeasureType, default: MeasureType.DEFAULT_TYPE })
  measureType?: MeasureType;

  @Column({ type: 'boolean', default: false })
  status?: boolean;

  @ManyToOne(() => User, (user) => user.femaleMeasurement)
  @JoinColumn({ name: 'users' })
  user?: User;

  @OneToMany(() => FemaleDetails, (customerDetails) => customerDetails.femaleMeasurement)
  customerDetails?: FemaleDetails[];
}