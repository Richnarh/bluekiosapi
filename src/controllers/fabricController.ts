import prisma from "@/config/prisma";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { isEmpty } from "class-validator";
import { NextFunction, Request, Response } from "express"
import { Fabric } from "generated/prisma";

export class FabricController{
    
    async create(req:Request, res:Response, next:NextFunction){
        try {
            const fabric = req.body as Fabric;
            let result;
            if(isEmpty(fabric.customerId)){
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            if(isEmpty(fabric.userId)){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            if(isEmpty(fabric.referenceId)){
                throw new AppError('ReferenceId is required', HttpStatus.BAD_REQUEST);
            }
            if(fabric.completedDate){
                fabric.completedDate = new Date(fabric.completedDate);
            }
            if(!fabric.id){
                result = await prisma.fabric.create({ data: fabric });
            }else{
                fabric.updatedAt = new Date();
                result = await prisma.fabric.update({
                    where: { id :  fabric.id },
                    data: fabric
                })
            }
            res.status(fabric.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${fabric.fabricName} ${fabric.id ? 'updated' : 'added'} successfully.`,
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getAllFabric(req:Request, res:Response, next:NextFunction){
        try {
            const userId = req.headers['userid']?.toString();
            const result = await prisma.customer.findMany({ where: { userId } })
            res.status(HttpStatus.OK).json({
                count: result.length,
                data: result
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getFabricById(req:Request, res:Response, next:NextFunction){
        try {
            const { id } = req.params;
            const fabric = await prisma.fabric.findUnique({ where: { id }});
            res.status(HttpStatus.OK).json({ data:fabric});
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getFabricsByRef(req:Request, res:Response, next:NextFunction){
        try {
            const { referenceId,customerId } = req.params;
            const fabric = await prisma.fabric.findFirst({ 
                where: { referenceId, customerId }
            });
            res.status(HttpStatus.OK).json({ data:fabric });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async deleteFabricById(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            if(!id){
                throw new AppError('Fabric is required', HttpStatus.BAD_REQUEST);
            }
            const deletes = await prisma.fabric.delete({
                where: { id }
            });
            res.status(HttpStatus.OK).json({ data: deletes, message: 'Fabric deleted successfully'});
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}