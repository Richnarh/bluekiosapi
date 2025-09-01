import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { Customer } from "../entities/Customer.js";
import { DataSource, Repository } from "typeorm";
import { DefaultService } from "../services/DefaultService.js";

export class CustomerController{
    private customerRepository:Repository<Customer>;
    private readonly ds:DefaultService;
    constructor(dataSource:DataSource){
        this.customerRepository = dataSource.getRepository(Customer);
        this.ds = new DefaultService(dataSource);
    }

    async create(req:Request, res:Response, next:NextFunction){
        try {
            const customer = req.body;
            if(!customer.userId){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            const user = await this.ds.getUserById(customer.userId);
            customer.user = user;
            const payload = this.customerRepository.create(customer);
            const result = await this.customerRepository.save(payload);
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