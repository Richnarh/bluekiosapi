import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { DressCollection } from './DressCollection.js';
import { ClothImage } from './ClothImage.js';
import { MaleDetails } from './MaleDetails.js';
import { FemaleDetails } from './FemaleDetails.js';
import { Reference } from './Reference.js';
import { PaymentInfo } from './PaymentInfo.js';
import { Fabric } from './Fabric.js';

@Entity('customers')
export class Customer extends BaseModel {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 100, unique: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 100 })
  address?: string;

  @ManyToOne(() => User, (user) => user.customer)
  @JoinColumn({ name: 'users' })
  user?: User;

  @OneToMany(() => DressCollection, (dressCollection) => dressCollection.customer)
  dressCollection?: DressCollection[];

  @OneToMany(() => ClothImage, (clothImage) => clothImage.customer)
  clothImage?: ClothImage[];

  @OneToMany(() => MaleDetails, (maleDetails) => maleDetails.customer)
  maleDetails?: MaleDetails[];

  @OneToMany(() => FemaleDetails, (femaleDetails) => femaleDetails.customer)
  femaleDetails?: FemaleDetails[];

  @OneToMany(() => Reference, (reference) => reference.customer)
  reference?: Reference[];

  @OneToMany(() => PaymentInfo, (payment) => payment.customer)
  payment?: PaymentInfo[];

  @OneToMany(() => Fabric, (fabric) => fabric.customer)
  fabric?: Fabric[];
}