import { NextFunction, Request, Response } from "express";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { isEmpty } from "class-validator";
import { MeasureType } from "../entities/enums.js";
import { MaleMeasurement } from "../entities/MaleMeasurement.js";
import { DataSource, Repository } from "typeorm";

export class MeasurementController{
    private maleMeasurementRepository:Repository<MaleMeasurement>;
    
    constructor(dataSource:DataSource){
        this.maleMeasurementRepository = dataSource.getRepository(MaleMeasurement);
    }

    async save(req:Request, res:Response, next:NextFunction){
        try {
            const male = req.body;
            let result;
            const payload = { ...male, measureType: MeasureType.DEFAULT_TYPE } // change the default to custom
            if(!isEmpty(payload.id)){
                result = await this.maleMeasurementRepository.update(payload.id,payload)
            }else{
                result = await this.maleMeasurementRepository.save(payload);
            }
            res.status(payload.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${payload.name} ${payload.id ? 'updated' : 'added'} successfully.`,
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getAllMaleMeasurement(req: Request, res: Response, next: NextFunction) {
        try {
            const measurement = await this.maleMeasurementRepository.find();
            res.status(HttpStatus.OK).json({
                message: 'Records found!.',
                data: measurement
            });
        } catch (error) {
          next(error);
        }
    }

    async getMaleMeasurementById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const femaleMeasurement = await this.maleMeasurementRepository.findOneBy({ id });
            if (femaleMeasurement) {
                res.status(HttpStatus.OK).json({ data: femaleMeasurement });
            } else {
                throw new AppError('Male measurement not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }

    async getActiveMaleMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const measurement = await this.maleMeasurementRepository.find({ where: { status: true } });
            if (measurement) {
                res.status(HttpStatus.OK).json({ data: measurement });
            } else {
                throw new AppError('female measurement not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }

    async deleteMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
         try {
            const { id } = req.params;
            const measurement = await this.maleMeasurementRepository.delete({ id });
            if (measurement) {
                res.status(HttpStatus.OK).json({ 
                    message: `Female Measurement deleted successfully`,
                    id
                });
            } else {
                throw new AppError('Measurment not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }
}