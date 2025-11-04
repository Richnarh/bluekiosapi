import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseModel.js";
import { User } from "./User.js";

@Entity({ name: 'settings' })
export class Settings extends BaseModel{

    @Column({ name: 'form_note', type: 'text', nullable: true })
    formNote?:string;

    @Column({ name: 'footer_note', type: 'varchar', length: 150, nullable: true })
    footerNote?:string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user?: User;
}