import prisma from "@/config/prisma";
import { FormType } from "@/models/model";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { Response,Request, NextFunction } from "express";

export class ReferenceController{

    async getReferences(req:Request, res:Response, next:NextFunction){
        try {
            const { customerId } = req.params;
            if(!customerId){
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const userId = req.headers['userId']?.toString();
            const references = await prisma.reference.findMany({
                where: {
                    AND: [
                        { customerId },
                        { userId }
                    ]
                }
            });
            const result = await Promise.all(references.map(async (item) => {
                if(item.refName === FormType.MALE_FORM){
                    return await prisma.maleDetails.findMany({
                        where: {
                            referenceId: item.id
                        },
                        include: {
                            reference: {
                                select: { id:true, refName:true },
                            },
                            maleMeasurement:{
                                select: { id:true, name:true },
                            }
                        }
                    });
                }else{
                    return await prisma.femaleDetails.findMany({
                        where: {
                            referenceId: item.id
                        },
                        include: {
                            reference: {
                                select: { id:true, refName:true },
                            },
                            femaleMeasurement:{
                                select: { id:true, name:true },
                            }
                        }
                    });
                }
            }));
            res.status(HttpStatus.OK).json({ count: result.length, data:result });
        } catch (error) {
            next(error);
        }
    }
}