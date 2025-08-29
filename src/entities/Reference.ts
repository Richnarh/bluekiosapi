import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { FemaleDetails } from './FemaleDetails.js';
import { PaymentInfo } from './PaymentInfo.js';
import { ClothImage } from './ClothImage.js';
import { Fabric } from './Fabric.js';
import { MaleDetails } from './MaleDetails.js';

@Entity('references')
export class Reference extends BaseModel {
  @Column({ name: 'ref_name', type: 'varchar', length: 100 })
  refName?: string;

  @ManyToOne(() => User, (user) => user.reference)
  @JoinColumn({ name: 'users' })
  user?: User;

  @ManyToOne(() => Customer, (customer) => customer.reference, { nullable: true })
  @JoinColumn({ name: 'customers' })
  customer?: Customer;

  @OneToMany(() => MaleDetails, (maleDetails) => maleDetails.reference)
  maleDetails?: MaleDetails[];

  @OneToMany(() => FemaleDetails, (femaleDetails) => femaleDetails.reference)
  femaleDetails?: FemaleDetails[];

  @OneToMany(() => PaymentInfo, (paymentInfo) => paymentInfo.reference)
  paymentInfo?: PaymentInfo[];

  @OneToMany(() => ClothImage, (clothImage) => clothImage.reference)
  clothImage?: ClothImage[];

  @OneToMany(() => Fabric, (fabric) => fabric.reference)
  fabric?: Fabric[];
}