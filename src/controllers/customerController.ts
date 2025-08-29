import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { Customer } from "../entities/Customer.js";
import { DataSource, Repository } from "typeorm";
import { isEmpty } from "class-validator";

export class CustomerController{
    private customerRepository:Repository<Customer>;

    constructor(dataSource:DataSource){
        this.customerRepository = dataSource.getRepository(Customer);
    }

    async create(req:Request, res:Response, next:NextFunction){
        try {
            const customer = req.body;
            let result;
            if(!isEmpty(customer.id)){
                result = await this.customerRepository.save(customer);
            }else{
                result = await this.customerRepository.save(customer);
            }
            res.status(customer.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${customer.fullName} ${customer.id ? 'updated' : 'added'} successfully.`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllCustomers(req:Request, res:Response, next:NextFunction){
        try {
            const userId = req.headers['userid']?.toString();
            const result = await this.customerRepository.find({ where: { user: {id: userId }} })
            res.status(HttpStatus.OK).json({
                count: result.length,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getCustomerById(req:Request, res:Response, next:NextFunction){
        try {
            const { id } = req.params;
            const customer = await this.customerRepository.findOneBy({ id });
            if (customer) {
                res.status(HttpStatus.OK).json({ data:customer });
            } else {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }

    async deleteImages(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            if(!id){
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const deletes = await this.customerRepository.delete({ id });
            res.status(HttpStatus.OK).json({ data: deletes, message: 'Customer deleted successfully'});
        } catch (error) {
            console.log(error)
            next(error);
        }
    }
}