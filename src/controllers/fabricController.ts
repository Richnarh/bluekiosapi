import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { isEmpty } from "class-validator";
import { DataSource, Repository } from "typeorm";
import { Fabric } from "../entities/Fabric.js";

export class FabricController{
    private readonly fabricRepository:Repository<Fabric>;
    constructor(datasource:DataSource){
        this.fabricRepository = datasource.getRepository(Fabric);
    }
    
    async create(req:Request, res:Response, next:NextFunction){
        try {
            const fabric = req.body;
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
                result = await this.fabricRepository.save(fabric);
            }else{
                result = await this.fabricRepository.save(fabric)
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
            const result = await this.fabricRepository.find({ 
                where: { 
                    user: { id: userId }
                } 
            })
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
            const fabric = await this.fabricRepository.findOneBy({ id });
            res.status(HttpStatus.OK).json({ data:fabric});
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getFabricsByRef(req:Request, res:Response, next:NextFunction){
        try {
            const { referenceId,customerId } = req.params;
            const fabric = await this.fabricRepository.findOne({ 
                where: { 
                    reference: { id: referenceId }, 
                    customer: { id: customerId }
                }
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
            const deletes = await this.fabricRepository.delete(id);
            res.status(HttpStatus.OK).json({ data: deletes, message: 'Fabric deleted successfully'});
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}