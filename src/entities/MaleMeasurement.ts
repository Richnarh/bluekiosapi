import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { MeasureType } from './enums.js';
import { MaleDetails } from './MaleDetails.js';

@Entity('male_measurements')
export class MaleMeasurement extends BaseModel {
//   @Column({ name: 'user_id', type: 'varchar', length: 255 })
//   userId: string;

  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column({ name: 'measure_type', type: 'enum', enum: MeasureType, default: MeasureType.DEFAULT_TYPE })
  measureType?: MeasureType;

  @Column({ type: 'boolean', default: false })
  status?: boolean;

  @ManyToOne(() => User, (user) => user.maleMeasurement)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => MaleDetails, (customerDetails) => customerDetails.maleMeasurement)
  customerDetails?: MaleDetails[];
}