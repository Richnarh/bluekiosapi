import { Response,Request, NextFunction } from "express";
import { DataSource } from "typeorm";
import { validate } from "class-validator";

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { ReferenceService } from "../services/referenceService.js";

export class ReferenceController{
    private readonly referenceService:ReferenceService;

    constructor(dataSource:DataSource){
        this.referenceService = new ReferenceService(dataSource);
    }

    async save(req: Request, res: Response, next: NextFunction) {
        try {
            const ref = {} as any;
            Object.assign(ref, req.body);

            const errors = await validate(ref);
            if (errors.length > 0) {
                throw new AppError(`Validation failed: ${errors}`, HttpStatus.BAD_REQUEST);
            }

                        const userId = req.headers['x-user-id']?.toString();
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.referenceService.save(ref, userId);

            res.status(ref.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${ref.id ? 'Reference updated' : 'Reference added'} successfully`,
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getReferences(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, customerId } = req.params;

            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }

            const result = await this.referenceService.getReferences(userId, customerId);

            res.status(HttpStatus.OK).json({
                message: 'References fetched successfully',
                count: result.count,
                data: result.data,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

     async getReferencesByCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { customerId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.referenceService.getReferencesByCustomer(customerId, userId);
            console.log('result: ', result)
            res.status(HttpStatus.OK).json({
                message: 'References and details fetched successfully',
                count: result.length,
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
    
    async getRefById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!id) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }

            const result = await this.referenceService.getRefById(id, userId);

            res.status(HttpStatus.OK).json({
                message: 'Reference fetched successfully',
                data: result,
            });
        } catch (error) {
            logger.error('Failed to fetch reference by ID', { error, id: req.params.id, userId: req.headers['X-User-Id'] });
            next(error);
        }
    }
}