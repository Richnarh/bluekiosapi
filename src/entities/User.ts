import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { Otp } from './Otp.js';
import { RefreshToken } from './RefreshToken.js';
import { Company } from './Company.js';
import { Customer } from './Customer.js';
import { ClothImage } from './ClothImage.js';
import { DressCollection } from './DressCollection.js';
import { Fabric } from './Fabric.js';
import { FemaleDetails } from './FemaleDetails.js';
import { FemaleMeasurement } from './FemaleMeasurement.js';
import { MaleDetails } from './MaleDetails.js';
import { PaymentInfo } from './PaymentInfo.js';
import { Reference } from './Reference.js';
import { MaleMeasurement } from './MaleMeasurement.js';

@Entity({ name: 'users' })
export class User extends BaseModel {
  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 100, unique: true })
  phoneNumber?: string;

  @Column({ name: 'email_address', type: 'varchar', length: 255, unique: true, nullable: true })
  emailAddress?: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified?: boolean;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username?: string;

  @OneToMany(() => Otp, (otp) => otp.user)
  otps?: Otp[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => MaleMeasurement, (maleMeasurement) => maleMeasurement.user)
  maleMeasurement?: MaleMeasurement[];

  @OneToMany(() => FemaleMeasurement, (femaleMeasurement) => femaleMeasurement.user)
  femaleMeasurement?: FemaleMeasurement[];

  @OneToMany(() => ClothImage, (clothImage) => clothImage.user)
  clothImage?: ClothImage[];

  @OneToMany(() => Customer, (customer) => customer.user)
  customer?: Customer[];

  @OneToMany(() => DressCollection, (dressCollection) => dressCollection.user)
  dressCollection?: DressCollection[];

  @OneToMany(() => MaleDetails, (maleDetails) => maleDetails.user)
  maleDetails?: MaleDetails[];

  @OneToMany(() => FemaleDetails, (femaleDetails) => femaleDetails.user)
  femaleDetails?: FemaleDetails[];

  @OneToMany(() => Reference, (reference) => reference.user)
  reference?: Reference[];

  @OneToMany(() => PaymentInfo, (payment) => payment.user)
  payment?: PaymentInfo[];

  @OneToMany(() => Fabric, (fabric) => fabric.user)
  fabric?: Fabric[];

  @OneToMany(() => Company, (company) => company.user)
  company?: Company[];
}