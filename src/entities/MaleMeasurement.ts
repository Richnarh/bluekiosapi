import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { MeasureType } from '../models/enums.js';

@Entity('male_measurements')
export class MaleMeasurement extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column({ name: 'measure_type', type: 'enum', enum: MeasureType, default: MeasureType.DEFAULT_TYPE })
  measureType?: MeasureType;

  @Column({ type: 'boolean', default: false })
  status?: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}