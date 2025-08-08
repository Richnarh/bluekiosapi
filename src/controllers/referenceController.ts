import prisma from "@/config/prisma";
import { FormType } from "@/models/model";
import { Ds } from "@/services/DefaultService";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { isEmpty } from "class-validator";
import { Response,Request, NextFunction } from "express";
import { Reference } from "generated/prisma";

export class ReferenceController{

    async createRef(req: Request, res: Response, next: NextFunction){
        try {
            const ref = req.body as Reference;
            const user = await Ds.getUser(req.headers['userid']?.toString()!);
            let result;
            if(isEmpty(ref.customerId)){
                throw new AppError('UserId and CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            
            if(!isEmpty(ref.id)){
                const reff = await prisma.reference.findUnique({ where: { id: ref.id }});
                if(reff){
                    const payload = {
                        ...reff,
                        description: ref.description,
                        fabricName: ref.fabricName,
                        completedDate: ref.completedDate ? new Date(ref.completedDate) : null,
                    } as Reference;
                    result = await prisma.reference.update({
                        where: { id: reff.id },
                        data: payload
                    });
                }
            }else{
                ref.addedBy = user?.fullName || null;
                result = await prisma.reference.create({ data:ref });
            }
            res.status(ref.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${ref.id ? 'Fabric updated' : 'Reference added'} successfully.`,
                data: result,
            });
        } catch (error) {
            console.log(error)
            next(error);
        }
    }

    async getReferences(req: Request, res: Response, next: NextFunction){
        try {
            const { userId, customerId } = req.params;
            if(!userId || !customerId){
                throw new AppError('UserId or CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const references = await prisma.reference.findMany({
                where: {
                    AND: [
                        { customerId },
                        { userId }
                    ]
                },
                select: {
                    id:true,
                    refName: true,
                    fabricName: true
                }
            });
            res.status(HttpStatus.OK).json({ count: references.length, data:references });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getReferencesByCustomer(req:Request, res:Response, next:NextFunction){
        try {
            const { customerId } = req.params;
            if(!customerId){
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const userId = req.headers['userid']?.toString();
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
            logger.error(error);
            next(error);
        }
    }

    async getRefById(req:Request, res:Response, next:NextFunction){
        try {
            const { id } = req.params;
            const ref = await prisma.reference.findUnique({ where: { id }});
            if (ref) {
                res.status(HttpStatus.OK).json({ data:ref });
            } else {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

}