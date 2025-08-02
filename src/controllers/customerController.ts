import prisma from "@/config/prisma";
import { CustomerService } from "@/services/customerService";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { NextFunction, Request, Response } from "express"
import {Customer } from "generated/prisma";

export class CustomerController{
    private customerService:CustomerService;

    constructor(){
        this.customerService = new CustomerService();
    }

    async create(req:Request, res:Response, next:NextFunction){
        try {
            const customer = req.body as Customer;
            const result = await this.customerService.create(customer);
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
            const result = await prisma.customer.findMany({ where: { userId } })
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
            const customer = await prisma.customer.findUnique({ where: { id }});
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
            const deletes = await prisma.customer.delete({
                where: { id }
            });
            res.status(HttpStatus.OK).json({ data: deletes, message: 'Customer deleted successfully'});
        } catch (error) {
            console.log(error)
            next(error);
        }
    }
}