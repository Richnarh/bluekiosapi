import { MeasurementService } from "@/services/measurmentService";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { NextFunction, Request, Response } from "express"
import { MaleMeasurement } from "generated/prisma";

export class MeasurementController{
    private measurementService:MeasurementService;

    constructor(){
        this.measurementService = new MeasurementService();
    }

    async addMeasurement(req:Request, res:Response, next:NextFunction){
        try {
            const male = req.body as MaleMeasurement;
            const result = await this.measurementService.create(male);
            res.status(male.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${male.name} ${male.id ? 'updated' : 'added'} successfully.`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllMeasurement(req: Request, res: Response, next: NextFunction) {
        try {
            const measurement = await this.measurementService.getAllMaleMeasurement();
            res.status(HttpStatus.OK).json({
                message: 'Records found!.',
                data: measurement
            });
        } catch (error) {
          next(error);
        }
    }

    async getMeasurementById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const { id, char } = req.params;
        const measurement = await this.measurementService.getMeasurementById(id,char);
        if (measurement) {
            res.status(HttpStatus.OK).json({ data: measurement });
        } else {
            throw new AppError('Male measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async getActiveMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const { char } = req.params;
        const measurement = await this.measurementService.getActiveMeasurement(char);
        if (measurement) {
            res.status(HttpStatus.OK).json({ data: measurement });
        } else {
            throw new AppError('Male measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async deleteMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id, char } = req.params;
            const measurement = await this.measurementService.deleteMeasurement(id, char);
            if (measurement) {
                res.status(HttpStatus.OK).json({ 
                    message: `${measurement.name} Measurement deleted successfully`,
                    char,
                    id: measurement.id
                });
            } else {
                throw new AppError('Measurment not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }
}