import { NextFunction, Request, Response} from 'express';
import { User } from 'generated/prisma';
import { UserService } from "@/services/userService";
import { AppError } from '@/utils/errors';
import { HttpStatus } from '@/utils/constants';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/middleware/authMiddleware';


export class UserController{
  private us:UserService;

  constructor(){
    this.us = new UserService();
  }

    async createUser(req:Request, res:Response, next:NextFunction){
        try {
            const user = req.body as User;
            const result = await this.us.addUser(user);
            res.json({
                message: 'User created successfully. Please verify your email with the OTP sent.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const users = await this.us.getUsers();
        res.status(HttpStatus.OK).json({
          count: users.length,
          data: users
        });
        } catch (error) {
          next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const user = await this.us.getUserById(id);
        if (user) {
            res.status(HttpStatus.OK).json({ data:user });
        } else {
            throw new AppError('User not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id;
            const user = req.body as unknown as User;
            const result = this.us.updateUser(id,user);
            logger.info(result);
            if (result) {
                res.status(HttpStatus.OK).json(result);
            } else {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const id = req.params.id;
        const user = await this.us.deleteUser(id);
        if (user) {
            res.status(HttpStatus.OK).json({ message: 'User deleted successfully' });
        } else {
            throw new AppError('User not found', HttpStatus.NOT_FOUND);
        }
        } catch (error) {
            next(error);
        }
    }

    async uploadImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params.id;
        if (!req.file) {
          logger.warn('No file uploaded', { userId: id });
          throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          logger.warn('Invalid file type', { userId: id, mimetype: req.file.mimetype });
          throw new AppError('Only JPEG or PNG images are allowed', HttpStatus.BAD_REQUEST);
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          logger.warn('File size exceeds limit', { userId: id, size: req.file.size });
          throw new AppError('File size exceeds 5MB limit', HttpStatus.BAD_REQUEST);
        }

        // Ensure the authenticated user matches the target user
        if (req.user?.id !== id) {
          logger.warn('Unauthorized image upload attempt', { userId: req.user?.id, targetId: id });
          throw new AppError('Unauthorized to upload image for this user', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.us.updateUserImage(id, `/uploads/${req.file.filename}`);
        if (!user) {
          logger.warn('User not found for image upload', { id });
          throw new AppError('User not found', HttpStatus.NOT_FOUND);
        }

        logger.info('Image uploaded successfully', { userId: id, imagePath: user.imagePath });
        res.status(HttpStatus.OK).json({
          message: 'Image uploaded successfully',
          user,
        });
      } catch (error) {
        next(error);
      }
    }
}