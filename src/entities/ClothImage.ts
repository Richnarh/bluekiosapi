import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { Reference } from './Reference.js';

@Entity('cloth_images')
export class ClothImage extends BaseModel {
  @Column({ name: 'image_url', type: 'text' })
  imageUrl?: string;

//   @Column({ name: 'customer_id', type: 'varchar', length: 255 })
//   customerId: string;

//   @Column({ name: 'user_id', type: 'varchar', length: 255 })
//   userId: string;

//   @Column({ name: 'reference_id', type: 'varchar', length: 255 })
//   referenceId: string;

  @ManyToOne(() => Customer, (customer) => customer.clothImage)
  @JoinColumn({ name: 'customers' })
  customer?: Customer;

  @ManyToOne(() => User, (user) => user.clothImage)
  @JoinColumn({ name: 'users' })
  user?: User;

  @ManyToOne(() => Reference, (reference) => reference.clothImage)
  @JoinColumn({ name: 'references' })
  reference?: Reference;
}