import { NextFunction, Request, Response } from "express";
import { DataSource } from 'typeorm';
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { FemaleDetailService } from "../services/femaleDetailService.js";
import { logger } from "../utils/logger.js";

export class FemaleDetailController {

    private readonly femaleDetailsService:FemaleDetailService;
    constructor(dataSource:DataSource) {
        this.femaleDetailsService = new FemaleDetailService(dataSource);
    }

    async createMany(req: Request, res: Response, next: NextFunction) {
        try {
            const details = req.body;
            if (!Array.isArray(details) || details.length === 0) {
                throw new AppError('Invalid input data', HttpStatus.BAD_REQUEST);
            }
            const { userId, customerId } = req.params;
            if (!userId) {
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            if (!customerId) {
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const count = this.femaleDetailsService.save(details,req.method,userId, customerId);
            res.status(HttpStatus.CREATED).json({ message: `Record added successfully.`, data: count });
        } catch (error) {
            next(error);
        }
    }

    async getAllDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params;
            const userId = req.headers['userid']?.toString();

            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.femaleDetailsService.getAllDetails(referenceId, userId);

            res.status(HttpStatus.OK).json({
                message: 'Female details fetched successfully',
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params;
            const userId = req.headers['userid']?.toString();

            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const count = await this.femaleDetailsService.deleteDetails(referenceId, userId);

            res.status(HttpStatus.OK).json({
                message: `Deleted ${count} female details successfully`,
                data: { count },
            });
        } catch (error) {
            logger.error(error)
            next(error);
        }
    }
}   