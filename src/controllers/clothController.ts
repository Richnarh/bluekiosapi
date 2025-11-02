import { NextFunction, Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';

import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { ClothImageService } from '../services/clothImageService.js';
import { ClothImage } from '../entities/ClothImage.js';

export class ClothController{
    private readonly clothImageService: ClothImageService;
    private readonly clothRepository:Repository<ClothImage>;
    constructor(dataSource:DataSource){
        this.clothImageService = new ClothImageService(dataSource);
        this.clothRepository = dataSource.getRepository(ClothImage);
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { id, customerId, referenceId } = req.body;
            const userId = req.headers['x-user-id']?.toString();

            if (!userId) {
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }
            if ((!customerId || !referenceId) || referenceId === 'undefined') {
                throw new AppError('CustomerId and ReferenceId is required', HttpStatus.BAD_REQUEST);
            }
            if (!req.file) {
                throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new AppError('Only JPEG, JPG and PNG images are allowed', HttpStatus.BAD_REQUEST);
            }
            const maxSize = 5 * 1024 * 1024;
            if (req.file.size > maxSize) {
                throw new AppError('File size exceeds 5MB limit', HttpStatus.BAD_REQUEST);
            }
          
            const result = await this.clothImageService.createOrUpdateImage({
                id,
                customerId,
                referenceId,
                userId,
                file: req.file,
            });

            res.status(HttpStatus.OK).json({
                message: 'Image uploaded successfully',
                result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getImage(req: Request, res: Response, next: NextFunction){
        try {
            const { customerId,referenceId } = req.params; 
                        const userId = req.headers['x-user-id']?.toString();
            if(!userId){
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }
            const images = await this.clothRepository.find({
                where: {
                    customer: { id: customerId },
                    reference: { id: referenceId },
                    user: { id: userId }
                },
                select: ['id', 'imageUrl'],
                relations: { reference: true, customer: true },
            });
            res.status(HttpStatus.OK).json({
                message: 'Images fetched successfully',
                data: images,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async delete2(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError('ClothId is required', HttpStatus.BAD_REQUEST);
            }

            const existingImage = await this.clothRepository.findOneBy({ id });
            if (!existingImage) {
                throw new AppError('Image not found', HttpStatus.NOT_FOUND);
            }
             if (!existingImage) {
                throw new AppError('Image not found or unauthorized', HttpStatus.NOT_FOUND);
            }
            const oldImagePath = path.join(`public/${existingImage.imageUrl}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, async (err) => {
                    if(err){
                        logger.error(err);
                        throw new AppError(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
                    }else{
                        await this.clothRepository.delete(id);
                    }
                });
            }
            res.status(HttpStatus.OK).json({data:true, message: 'Image deleted successfully'});
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.headers['x-user-id']?.toString();
            if(!userId){
                throw new AppError('UserId is required to delete image', HttpStatus.BAD_REQUEST);
            }
            await this.clothImageService.deleteImage(id, userId);
            res.status(HttpStatus.OK).json({
                data: true,
                message: 'Image deleted successfully',
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}