import { Customer } from "generated/prisma";
import { CrudService } from "./crudservice";
import prisma from "@/config/prisma";
import { plainToInstance } from "class-transformer";
import { CustomerValidator } from "@/utils/validators";
import { isEmpty, validate } from "class-validator";
import { logger } from '@/utils/logger';
import { AppError } from "@/utils/errors";
import { HttpStatus } from "@/utils/constants";

export class CustomerService{
    private custService:CrudService<Customer>;

    constructor(){
        this.custService = new CrudService<Customer>(prisma.customer);
    }

    async create(customer:Customer):Promise<Omit<Customer, 'createdAt' | 'updatedAt'> | null>{
        const dto = plainToInstance(CustomerValidator, customer);
        const errors = await validate(dto);
         if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn('Validation failed for create:user', { errors: errorMessages });
            throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        let result;
        if(!isEmpty(customer.id)){
            result = this.custService.update(customer.id, customer);
        }else{
            result = await this.custService.create(customer)
        }
        return result;
    }

    async getAll(userId:string){
        const res = prisma.customer.findMany({ where: { userId } })
        logger.info(res);
        return res;
    }

    async getCustomeryId(id: string){
        const u = await this.custService.findUnique(id);
        let customer = null;
        if (u) {
            customer = u;
            logger.info('Customer retrieved successfully', { id });
        } else {
            logger.warn('Customer not found', { id });
        }
        return customer;
    }
}