import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import prisma from '@/config/prisma';
import { Ds } from '@/services/DefaultService';
import { HttpStatus } from '@/utils/constants';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ClothImage } from 'generated/prisma';
import { isEmpty } from 'class-validator';
import path from 'path';

export class ClothController{

  async create(req: Request, res: Response, next: NextFunction) {
       try {
        const { id, customerId, referenceId } = req.body;
        const userId = req.headers['userid']?.toString();
        if(!userId){
            throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
        }
        if(isEmpty(customerId) || isEmpty(referenceId)){
            throw new AppError('CustomerId and ReferenceId is required', HttpStatus.BAD_REQUEST);
        }
        if (!req.file) {
          throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new AppError('Only JPEG, JPG and PNG images are allowed', HttpStatus.BAD_REQUEST);
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new AppError('File size exceeds 5MB limit', HttpStatus.BAD_REQUEST);
        }
        const user = await Ds.getUser(userId);
        if(!user){
            throw new AppError('User is required', HttpStatus.BAD_REQUEST);
        }
        const uploadDir = path.join(`uploads/${user.companyName.replace(/\s/g, "")}`);
        console.log('uploadDir: ', uploadDir)
        if (!fs.existsSync(`public/${uploadDir}`)) {
            throw new AppError('Directory does not exist for upload', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if(!fs.existsSync(`public/${uploadDir}`)){
            throw new AppError(`Directory: /uploads/${user.companyName}, does not exist for upload`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if(id){
            const existingImage = await prisma.clothImage.findFirst({
                where: { id, customerId, userId },
            });
            if (!existingImage) {
                throw new AppError('Image not found or unauthorized', HttpStatus.NOT_FOUND);
            }
            const oldImagePath = path.join(`public/${existingImage.imageUrl}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if(err){
                        logger.error(err);
                        throw new AppError(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                });
            }
        }
        const payload = {
            imageUrl: `${uploadDir}/${req.file.originalname}`,
            addedBy: user.fullName || null,
            customerId,
            userId,
            referenceId
        } as ClothImage;

        let result;
        if(id){
            result = await prisma.clothImage.update({
                where: { id },
                data: payload
            })
        }else{
            result = await prisma.clothImage.create({ data: payload });
        }
        if(!result){
            throw new AppError('Could not upload image', HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.OK).json({
          message: 'Image uploaded successfully',
          result,
        });
      } catch (error) {
        logger.error(error);
        next(error);
      }
    }

    async getImages(req: Request, res: Response, next: NextFunction){
        try {
            const { customerId } = req.params; 
            const userId = req.headers['userid']?.toString();
            if(!userId){
                throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
            }
            const images = await prisma.clothImage.findMany({
                where: {
                    customerId, userId,
                },
                select: {
                    id: true,
                    imageUrl: true,
                    customerId: true,
                    referenceId: true,
                },
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

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError('ClothId is required', HttpStatus.BAD_REQUEST);
            }

            const existingImage = await prisma.clothImage.findUnique({
                where: { id }
            });
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
                        await prisma.clothImage.delete({
                            where: { id }
                        });
                    }
                });
            }
            res.status(HttpStatus.OK).json({data:true, message: 'Image deleted successfully'});
        } catch (error) {
            next(error);
        }
    }

    async deleteImagddes(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError('ClothId is required', HttpStatus.BAD_REQUEST);
            }

            const existingImage = await prisma.clothImage.findUnique({
                where: { id }
            });
            if (!existingImage) {
                throw new AppError('Image not found', HttpStatus.NOT_FOUND);
            }

            const imageUrl = path.join(`public/${existingImage.imageUrl}`);
            
            try {
                await fsp.access(imageUrl, fsp.constants.F_OK);
                await fsp.unlink(imageUrl);
                
                try {
                    await fsp.access(imageUrl, fsp.constants.F_OK);
                    throw new AppError('Failed to delete image', HttpStatus.INTERNAL_SERVER_ERROR);
                } catch (err:any) {
                    if (err.code === 'ENOENT') {
                        await prisma.clothImage.delete({
                            where: { id }
                        });
                        
                        logger.info(`Image successfully deleted at ${imageUrl}`);
                         res.status(HttpStatus.OK).json({ 
                            deleted: true, 
                            message: 'Image deleted successfully' 
                        });
                        return;
                    }
                    throw new AppError(`Error verifying deletion: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            } catch (err:any) {
                if (err.code === 'ENOENT') {
                    logger.info(`Image not found at ${imageUrl}, proceeding with database deletion`);
                    await prisma.clothImage.delete({
                        where: { id }
                    });
                     res.status(HttpStatus.OK).json({ 
                        deleted: true, 
                        message: 'Image record deleted successfully' 
                    });
                    return;
                }
                throw new AppError(`Error accessing file: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }
}