import { NextFunction, Request, Response } from "express";
import { DataSource,Repository } from 'typeorm';
import { isEmpty } from "class-validator";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { FemaleMeasurement } from "../entities/FemaleMeasurement.js";
import { MeasureType } from "../entities/enums.js";
import { logger } from "../utils/logger.js";

export class femaleMeasurementController{
    private femaleMeasurementRepository:Repository<FemaleMeasurement>;

    constructor(dataSource:DataSource){
        this.femaleMeasurementRepository = dataSource.getRepository(FemaleMeasurement);
    }

    async save(req:Request, res:Response, next:NextFunction){
        try {
            const female = req.body;
            let result;
            const payload = { ...female, measureType: MeasureType.DEFAULT_TYPE }
            if(!isEmpty(payload.id)){
                result = await this.femaleMeasurementRepository.update(payload.id,payload)
            }else{
                result = await this.femaleMeasurementRepository.save(payload);
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

    async getFemaleMeasurements(req: Request, res: Response, next: NextFunction) {
        try {
            const measurement = await this.femaleMeasurementRepository.find();
            console.log('measurement: ', measurement)
            res.status(HttpStatus.OK).json({
                message: 'Records found!.',
                data: measurement
            });
        } catch (error) {
          logger.error(error);
          next(error);
        }
    }

    async getFemaleMeasurementById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const { id } = req.params;
        const femaleMeasurement = await this.femaleMeasurementRepository.findOneBy({ id });
        if (femaleMeasurement) {
            res.status(HttpStatus.OK).json({ data: femaleMeasurement });
        } else {
            throw new AppError('Male measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async getActiveMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const measurement = await this.femaleMeasurementRepository.find({ where: { status: true } });
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
            const measurement = await this.femaleMeasurementRepository.delete({ id });
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