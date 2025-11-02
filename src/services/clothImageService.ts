import { DataSource, Repository } from 'typeorm';
import { ClothImage } from "../entities/ClothImage.js";
import * as fs from 'fs';
import path from 'path';

import { DefaultService } from './DefaultService.js';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export class ClothImageService{
    private readonly clothImageRepository:Repository<ClothImage>;
    private readonly ds:DefaultService;

    constructor(dataSource:DataSource){
        this.clothImageRepository = dataSource.getRepository(ClothImage);
        this.ds = new DefaultService(dataSource);
    }

    async createOrUpdateImage({ id, customerId, referenceId, userId, file}: {
        id?: string;
        customerId: string;
        referenceId: string;
        userId: string;
        file: Express.Multer.File;
    }) {
        const user = await this.ds.getUserById(userId);
        if (!user) {
            throw new AppError('User is required', HttpStatus.BAD_REQUEST);
        }
        const company = await this.ds.getCompanyByUser(user.id);
        if (!company) {
            throw new AppError('Company Name is required', HttpStatus.BAD_REQUEST);
        }

        const customer = await this.ds.getCustomerById(customerId);
        const reference = await this.ds.getReferenceById(referenceId);

        const uploadDir = path.join(`uploads/${company.companyName?.replace(/\s/g, '')}`);
        if (!fs.existsSync(`public/${uploadDir}`)) {
            throw new AppError(`Directory: /uploads/${company.companyName}, does not exist for upload`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (id) {
            const existingImage = await this.clothImageRepository.findOne({
                where: { 
                    id, 
                    customer: { id: customerId }, 
                    user: { id: userId },
                    reference: { id: referenceId } 
                },
            });
            if (!existingImage) {
                throw new AppError('Image not found or unauthorized', HttpStatus.NOT_FOUND);
            }
            const oldImagePath = path.join(`public/${existingImage.imageUrl}`);
            if (fs.existsSync(oldImagePath)) {
                await fs.promises.unlink(oldImagePath).catch((err) => {
                    logger.error(err);
                    throw new AppError(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
                });
            }
        }

        const payload = {
            imageUrl: `${uploadDir}/${file.originalname}`,
            addedBy: user.fullName || null,
            customer, user, reference 
        } as ClothImage;

        const createImage = this.clothImageRepository.create(payload);
        const result = await this.clothImageRepository.save(createImage);
        if (!result) {
            throw new AppError('Could not upload image', HttpStatus.BAD_REQUEST);
        }
        return result;
    }

    async deleteImage(id: string, userId: string) {
        if (!id) {
            throw new AppError('Image ID is required', HttpStatus.BAD_REQUEST);
        }
        if (!userId) {
            throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
        }
        const existingImage = await this.clothImageRepository.findOneBy({ id, user: {id: userId} });
        if (!existingImage) {
            throw new AppError('Image not found or unauthorized', HttpStatus.NOT_FOUND);
        }
        
        const oldImagePath = path.join(`public/${existingImage.imageUrl}`);
        if (fs.existsSync(oldImagePath)) {
            await fs.promises.unlink(oldImagePath).catch((err) => {
                logger.error('Failed to delete file', { error: err, imageUrl: existingImage.imageUrl });
                throw new AppError('Failed to delete image file', HttpStatus.INTERNAL_SERVER_ERROR);
            });
        }

        const result = await this.clothImageRepository.delete(id);
        if (result.affected === 0) {
            logger.warn('Database record not found after file deletion', { id, userId });
            throw new AppError('Image record not found in database', HttpStatus.NOT_FOUND);
        }

        return true;
    }
}