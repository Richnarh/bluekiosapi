import { NextFunction, Request, Response} from 'express';
import { DataSource } from 'typeorm';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserValidator } from '../utils/validators.js';
import { UserService } from '../services/userService.js';
import { User } from '../entities/User.js';

export class UserController{
  private readonly userService:UserService;
  constructor(dataSource:DataSource){
    this.userService = new UserService(dataSource);
  }

    async save2(req:Request, res:Response, next:NextFunction){
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
            const result = await this.userService.save(rest, companyName);
            res.json({
                message: 'User created successfully. Please verify your account with the OTP sent, OTP expires after 10 munites',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async save(req: Request, res: Response, next: NextFunction) {
        try {
            const user = {} as any;
            Object.assign(user, req.body);
            const userDto = plainToInstance(UserValidator, user);
            const errors = await validate(userDto);
            if (errors.length > 0) {
                throw new AppError(`failed: ${errors}`, HttpStatus.BAD_REQUEST);
            }
            if(!user.companyName){
              throw new AppError('CompanyName is required', HttpStatus.BAD_REQUEST);
            }
            const { companyName, ...rest } = user;
            const result = await this.userService.save(rest as User, companyName);

            res.status(HttpStatus.CREATED).json({
                message: 'User added successfully',
                data: result,
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
        const users = await this.userService.getUsers();
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
        const user = await this.userService.getUserById(id);
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
            const user = req.body as User;
            const result = this.userService.updateUser(id,user);
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
        const user = await this.userService.deleteUser(id);
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