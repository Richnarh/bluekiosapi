import prisma from "@/config/prisma";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { isEmpty } from "class-validator";
import { NextFunction,Request,Response } from "express";
import { PaymentInfo } from "generated/prisma";

export class PaymentController{
    public create = async (req: Request, res: Response, next:NextFunction) => {
        try {
            let result;
            const payment = req.body as PaymentInfo;
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
            if(payment.id){
                payment.updatedAt = new Date();
                result = await prisma.paymentInfo.update({
                    where: { id: payment.id },
                    data: payment
                })
            }else{
                result = await prisma.paymentInfo.create({ data: payment });
            }
            res.status(HttpStatus.CREATED).json(result);
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getPaymentsByCustomer (req: Request, res: Response, next: NextFunction){
        try {
            const { customerId } = req.params;  
            const userId = req.headers['userId']?.toString();
            const result = await prisma.paymentInfo.findMany({
                where: { 
                    AND: [
                        { customerId },
                        { userId },
                    ]
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
            const result = await prisma.paymentInfo.findFirst({
                where: { 
                    AND: [
                        { referenceId },
                        { customerId },
                        { userId },
                    ]
                }
            });
            res.status(HttpStatus.OK).json({ data:  result });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}