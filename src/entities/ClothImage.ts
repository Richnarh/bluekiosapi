import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './BaseModel.js';
import { User } from './User.js';
import { Customer } from './Customer.js';
import { Reference } from './Reference.js';

@Entity('cloth_images')
export class ClothImage extends BaseModel {
  @Column({ name: 'image_url', type: 'text' })
  imageUrl?: string;
  
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Reference)
  @JoinColumn({ name: 'referenceId' })
  reference?: Reference;
}