import { NextFunction, Request, Response } from "express";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { MeasureType } from "../entities/enums.js";
import { MaleMeasurement } from "../entities/MaleMeasurement.js";
import { DataSource, Repository } from "typeorm";
import { DefaultService } from "../services/DefaultService.js";

export class MeasurementController{
    private maleMeasurementRepository:Repository<MaleMeasurement>;
    private readonly ds:DefaultService;
    constructor(dataSource:DataSource){
        this.maleMeasurementRepository = dataSource.getRepository(MaleMeasurement);
        this.ds = new DefaultService(dataSource);
    }

    async save(req:Request, res:Response, next:NextFunction){
        try {
            const male = req.body;
            if(!male.userId){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            const user = await this.ds.getUserById(male.userId);
            male.user = user;
            const load = { ...male, measureType: MeasureType.DEFAULT_TYPE } // change the default to custom
            const payload = this.maleMeasurementRepository.create(load);
            const result = await this.maleMeasurementRepository.save(payload);
            res.status(HttpStatus.CREATED).json({
                message: `Action applied successfully.`,
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
                    message: `Male Measurement deleted successfully`,
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