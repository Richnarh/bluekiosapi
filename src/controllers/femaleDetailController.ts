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

    async saveAllDetailsBycustomerId(req: Request, res: Response, next: NextFunction) {
        try {
            const details = req.body;
            if (!Array.isArray(details) || details.length === 0) {
                throw new AppError('Invalid input data', HttpStatus.BAD_REQUEST);
            }
            const { customerId } = req.params;
                        const userId = req.headers['x-user-id']?.toString();
            if (!userId) {
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            if (!customerId) {
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const result = await this.femaleDetailsService.save(details, req.method, userId, customerId);
            res.status(HttpStatus.OK).json({
                message: `${req.method === 'POST' ? 'Created' : 'Updated'} ${result.count} male details successfully`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async fetchFemaleDetailsByReferenceId(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.femaleDetailsService.fetchAllDetailsByRef(referenceId, userId);

            res.status(HttpStatus.OK).json({
                message: 'Female details fetched successfully',
                data: result.data,
                count: result.count,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async fetchFemaleDetailsByCustomerId(req: Request, res: Response, next: NextFunction) {
        try {
            const { customerId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!customerId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.femaleDetailsService.getAllDetails(customerId, userId);

            res.status(HttpStatus.OK).json({
                message: 'Female details fetched successfully',
                data: result.data,
                count: result.count,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async deleteDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

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