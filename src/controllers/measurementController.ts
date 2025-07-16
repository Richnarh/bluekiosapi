import { MeasurementService } from "@/services/measurmentService";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { NextFunction, Request, Response } from "express"
import { FemaleMeasurement, MaleMeasurement } from "generated/prisma";

export class MeasurementController{
    private measurementService:MeasurementService;

    constructor(){
        this.measurementService = new MeasurementService();
    }

    async addMale(req:Request, res:Response, next:NextFunction){
        try {
            const male = req.body as MaleMeasurement;
            const result = await this.measurementService.addMaleMeasurement(male);
            res.status(male.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${male.name} ${male.id ? 'updated' : 'addedd'} successfully.`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async addFemale(req:Request, res:Response, next:NextFunction){
        try {
            const female = req.body as FemaleMeasurement;
            const result = await this.measurementService.addFemaleMeasurement(female);
            res.status(female.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${female.name} ${female.id ? 'updated' : 'addedd'} successfully.`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllMale(req: Request, res: Response, next: NextFunction) {
        try {
        const male = await this.measurementService.getAllMaleMeasurement();
        res.status(HttpStatus.OK).json({
          count: male.length,
          data: male
        });
        } catch (error) {
          next(error);
        }
    }

    async getAllFemale(req: Request, res: Response, next: NextFunction) {
        try {
        const male = await this.measurementService.getAllMaleMeasurement();
        res.status(HttpStatus.OK).json({
          count: male.length,
          data: male
        });
        } catch (error) {
          next(error);
        }
    }

    async getMaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const male = await this.measurementService.getMaleById(id);
        if (male) {
            res.status(HttpStatus.OK).json({ data: male });
        } else {
            throw new AppError('Male measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async getFemaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const female = await this.measurementService.getFemaleById(id);
        if (female) {
            res.status(HttpStatus.OK).json({ data: female });
        } else {
            throw new AppError('Female measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async deleteMale(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const user = await this.measurementService.deleteMale(id);
        if (user) {
            res.status(HttpStatus.OK).json({ message: 'Male measurement deleted successfully' });
        } else {
            throw new AppError('Male measurment not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async deleteFemale(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const user = await this.measurementService.deleteFemale(id);
        if (user) {
            res.status(HttpStatus.OK).json({ message: 'Female measurement deleted successfully' });
        } else {
            throw new AppError('Femal measurement not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }
}