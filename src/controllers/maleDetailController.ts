import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "@/utils/constants";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/errors";
import { MaleDetails } from "generated/prisma";
import { MaleDetailService } from "@/services/maleDetailService";

export class MaleDetailController {
    private maleService:MaleDetailService;

    constructor() {
        this.maleService = new MaleDetailService();
    }

    async createMany(req: Request, res: Response, next: NextFunction) {
        try {
            const details = req.body as MaleDetails[];
            if (!Array.isArray(details) || details.length === 0) {
                throw new AppError('Invalid input data', HttpStatus.BAD_REQUEST);
            }
            const userId = req.headers['userid']?.toString();
            const count = this.maleService.save(details,req.method,userId!);
            res.status(HttpStatus.CREATED).json({ message: `Record added successfully.`, data: count });
        } catch (error) {
            next(error);
        }
    }

    async getAllDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params
            let result = await prisma.maleDetails.findMany({
                    where: {
                        referenceId
                    },
                    include: {
                        maleMeasurement: {
                            select:{ id:true, name:true }
                        }
                    }
                })
            res.status(HttpStatus.OK).json({ data: result });
        } catch (error) {
            next(error);
        }
    }
}   