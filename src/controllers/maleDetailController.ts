import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { MaleDetailService } from "../services/maleDetailService.js";
import { DataSource } from "typeorm";
import { logger } from "../utils/logger.js";

export class MaleDetailController {
    private maleDetailsService:MaleDetailService;
    constructor(dataSource:DataSource) {
        this.maleDetailsService = new MaleDetailService(dataSource);
    }

    async saveAllDetailsBycustomerId(req: Request, res: Response, next: NextFunction) {
        try {
            const details = req.body;
            const { customerId } = req.params;
                        const userId = req.headers['x-user-id']?.toString();
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }
            if (!details || !Array.isArray(details)) {
                throw new AppError('Details must be an array', HttpStatus.BAD_REQUEST);
            }
            if (!customerId) {
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }

            const result = await this.maleDetailsService.save(details, req.method, userId, customerId);

            res.status(HttpStatus.OK).json({
                message: `${req.method === 'POST' ? 'Created' : 'Updated'} ${result.count} male details successfully`,
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async fetchMaleDetailsByCustomerId(req: Request, res: Response, next: NextFunction) {
        try {
            const { customerId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.maleDetailsService.fetchAllDetailsByCustomer(customerId, userId);

            res.status(HttpStatus.OK).json({
                message: 'Male details fetched successfully',
                data: result.data,
                count: result.count,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async fetchMaleDetailsByReferenceId(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params;
            const userId = req.headers['x-user-id']?.toString();

            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }

            const result = await this.maleDetailsService.fetchAllDetailsByRef(referenceId, userId);

            res.status(HttpStatus.OK).json({
                message: 'Male details fetched successfully',
                data: result.data,
                count: result.count,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async deleteDetails(req: Request, res: Response, next: NextFunction){
        try {
            const { referenceId } = req.params;
                        const userId = req.headers['x-user-id']?.toString();
            if(!referenceId){
                throw new AppError('referenceId is required', HttpStatus.BAD_REQUEST);
            }
            const count = this.maleDetailsService.deleteDetails(referenceId,userId!);
            res.status(HttpStatus.OK).json({message: `form deleted successfully`, count});
        } catch (error) {
            next(error);
        }
    }
}   