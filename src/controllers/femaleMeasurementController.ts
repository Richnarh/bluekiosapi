import { NextFunction, Request, Response } from "express";
import { DataSource,Repository } from 'typeorm';
import { isEmpty } from "class-validator";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { FemaleMeasurement } from "../entities/FemaleMeasurement.js";
import { MeasureType } from "../models/enums.js";
import { logger } from "../utils/logger.js";
import { DefaultService } from "../services/DefaultService.js";

export class femaleMeasurementController{
    private femaleMeasurementRepository:Repository<FemaleMeasurement>;
    private readonly ds:DefaultService;
    constructor(dataSource:DataSource){
        this.femaleMeasurementRepository = dataSource.getRepository(FemaleMeasurement);
        this.ds = new DefaultService(dataSource);
    }

    async save(req:Request, res:Response, next:NextFunction){
        try {
            const female = req.body;
            if(!female.userId){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            const user = await this.ds.getUserById(female.userId);
            female.user = user;
            const load = { ...female, measureType: MeasureType.CUSTOM };
            const payload = this.femaleMeasurementRepository.create(load);
            const result = await this.femaleMeasurementRepository.save(payload);
            res.status(HttpStatus.CREATED).json({
                message: `Action applied successfully.`,
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
            throw new AppError('Female measurement not found', HttpStatus.NOT_FOUND);
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
                throw new AppError('female measurment not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }
}