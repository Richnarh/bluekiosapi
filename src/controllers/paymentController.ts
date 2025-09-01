import { NextFunction,Request,Response } from "express";
import { DataSource, Repository } from "typeorm";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { isEmpty } from "class-validator";
import { PaymentInfo } from "../entities/PaymentInfo.js";
import { DefaultService } from "../services/DefaultService.js";

export class PaymentController{
    private readonly paymentRepository:Repository<PaymentInfo>;
    private readonly ds:DefaultService;
    constructor(dataSource:DataSource){
        this.paymentRepository = dataSource.getRepository(PaymentInfo);
        this.ds = new DefaultService(dataSource);
    }

    public savePaymentInfo = async (req: Request, res: Response, next:NextFunction) => {
        try {
            const payment = req.body;
            if(isEmpty(payment.customerId)){
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            if(isEmpty(payment.userId)){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            if(isEmpty(payment.referenceId)){
                throw new AppError('ReferenceId is required', HttpStatus.BAD_REQUEST);
            }
            if (payment.date) {
                payment.date = new Date(payment.date);
            }
            const user = await this.ds.getUserById(payment.userId);
            const customer = await this.ds.getCustomerById(payment.customerId);
            const reference = await this.ds.getReferenceById(payment.referenceId);
            
            const paymentInfo = { ...payment, user, customer, reference };
            const payload = this.paymentRepository.create(paymentInfo);
            const result = await this.paymentRepository.save(payload);
            res.status(req.method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK).json(result);
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getPaymentsByCustomer (req: Request, res: Response, next: NextFunction){
        try {
            const { customerId, } = req.params;  
            const userId = req.headers['X-User-Id']?.toString();
            const result = await this.paymentRepository.find({
                where: { 
                    customer: { id: customerId },
                    user: { id: userId },
                }
            });
            res.status(HttpStatus.OK).json({ data:  result });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getPaymentsByReference (req: Request, res: Response, next: NextFunction){
        try {
            const { referenceId, customerId } = req.params;  
            const userId = req.headers['X-User-Id']?.toString();
            const result = await this.paymentRepository.findOne({
                where: { 
                    reference: { id: referenceId },
                    customer: { id: customerId },
                    user: { id: userId },
                }
            });
            res.status(HttpStatus.OK).json({ data:  result });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}