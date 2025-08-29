import { NextFunction,Request,Response } from "express";
import { DataSource, Repository } from "typeorm";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { isEmpty } from "class-validator";
import { PaymentInfo } from "../entities/PaymentInfo.js";

export class PaymentController{
    private readonly paymentRepository:Repository<PaymentInfo>
    constructor(dataSource:DataSource){
        this.paymentRepository = dataSource.getRepository(PaymentInfo);
    }
    public create = async (req: Request, res: Response, next:NextFunction) => {
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
            const result = await this.paymentRepository.save(payment);
            res.status(HttpStatus.CREATED).json(result);
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getPaymentsByCustomer (req: Request, res: Response, next: NextFunction){
        try {
            const { customerId, } = req.params;  
            const userId = req.headers['userid']?.toString();
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
            const userId = req.headers['userid']?.toString();
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