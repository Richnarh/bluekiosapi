import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "@/utils/constants";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/errors";
import { FemaleDetails } from "generated/prisma";
import { FemaleDetailService } from "@/services/femaleDetailService";

export class FemaleDetailController {
    private femaleService:FemaleDetailService;
    constructor() {
        this.femaleService = new FemaleDetailService();
    }

    async createMany(req: Request, res: Response, next: NextFunction) {
        try {
            const details = req.body as FemaleDetails[];
            if (!Array.isArray(details) || details.length === 0) {
                throw new AppError('Invalid input data', HttpStatus.BAD_REQUEST);
            }
            const { userId } = req.params;
            if (!userId) {
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            const count = this.femaleService.save(details,req.method,userId);
            res.status(HttpStatus.CREATED).json({ message: `Record added successfully.`, data: count });
        } catch (error) {
            next(error);
        }
    }

    async getAllDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { referenceId } = req.params
            const result = await prisma.femaleDetails.findMany({
                    where: {
                        referenceId
                    },
                    include: {
                        femaleMeasurement: {
                            select:{ id:true, name:true }
                        }
                    }
                })
            res.status(HttpStatus.OK).json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteDetails(req: Request, res: Response, next: NextFunction){
        try {
            const { referenceId } = req.params;
            const userId = req.headers['userId']?.toString();
            if(!referenceId){
                throw new AppError('referenceId is required', HttpStatus.BAD_REQUEST);
            }
            const count = this.femaleService.deleteDetails(referenceId,userId!);
            res.status(HttpStatus.OK).json({message: `form deleted successfully`, count});
        } catch (error) {
            next(error);
        }
    }
}   