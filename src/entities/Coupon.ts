import { Column, Entity } from "typeorm";
import { BaseModel } from "./BaseModel.js";

@Entity({ name: 'coupons' })
export class Coupon extends BaseModel{
  @Column({ name: 'coupon_name', type: 'varchar', length: 100, unique: true, nullable: true })
  couponName?: string;

  @Column({ name: 'coupon_code', type: 'varchar', length: 100, unique: true, nullable: true })
  couponCode?: string;

  @Column({ name: 'expires_at', type: 'date' })
  expiresAt?: Date;
}