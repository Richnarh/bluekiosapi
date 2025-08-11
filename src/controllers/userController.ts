import { NextFunction, Request, Response} from 'express';
import { User } from 'generated/prisma';
import { UserService } from "@/services/userService";
import { AppError } from '@/utils/errors';
import { HttpStatus } from '@/utils/constants';
import { logger } from '@/utils/logger';
import { UserValidator } from '@/utils/validators';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export class UserController{
  private us:UserService;

  constructor(){
    this.us = new UserService();
  }

    async createUser(req:Request, res:Response, next:NextFunction){
        try {
            const user = req.body;
            const userDto = plainToInstance(UserValidator, user);
            const errors = await validate(userDto);
            if (errors.length > 0) {
                const errorMessages = errors
                .map(err => Object.values(err.constraints || {}).join(', '))
                .join('; ');
                logger.warn({ errors: errorMessages });
                throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
            }
            if(!user.companyName){
              throw new AppError('CompanyName is required', HttpStatus.BAD_REQUEST);
            }
            const { companyName, ...rest } = user;
            const result = await this.us.addUser(rest, companyName);
            res.json({
                message: 'User created successfully. Please verify your account with the OTP sent, OTP expires after 10 munites',
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
}