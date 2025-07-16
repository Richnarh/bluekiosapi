import bcrypt from 'bcrypt';

import prisma from "@/config/prisma";
import { User } from '../../generated/prisma';
import { CrudService } from "./crudservice";
import { plainToInstance } from 'class-transformer';
import { UserValidator } from '@/utils/validators';
import { validate } from 'class-validator';
import { logger } from '@/utils/logger';
import { AppError } from "@/utils/errors";
import { HttpStatus } from "@/utils/constants";
import { EmailService } from "./emailService";
import { AuthService } from './authService';

export class UserService{
    private SALT_ROUNDS = 10;
    private emailService:EmailService;
    private userService:CrudService<User>;
    private authService:AuthService;
    
    constructor(){
        this.userService = new CrudService<User>(prisma.user);
        this.authService = new AuthService();
        this.emailService = new EmailService();
    }

    async addUser(user:User):Promise<Omit<User, 'password' | 'createdAt' | 'updatedAt'>>{
        const userDto = plainToInstance(UserValidator, user);
        const errors = await validate(userDto);
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn({ errors: errorMessages });
            throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        const hashPassword = await bcrypt.hash(user.password, this.SALT_ROUNDS);
        
        user.password = hashPassword;
        const newUser = await this.userService.create(user);
        this.generateOtp(newUser);
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
    
    async generateOtp(user:User){
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await this.authService.createOtp(user.id, otpCode);
      await this.emailService.sendOtpEmail(user.emailAddress, otpCode);
    }

    async getUsers(): Promise<Omit<User, 'password'>[]> {
        const users = await this.userService.findMany();
        const newUsers = users.map(({ password, ...user }) => user);
        return newUsers;
    }

    async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
        const u = await this.userService.findUnique(id);
        let user = null;
        if (u) {
            const { password, ...newUser } = u;
            user = newUser
            logger.info('User retrieved successfully', { id });
        } else {
            logger.warn('User not found', { id });
        }
        
        return user;
    }

    async updateUser(id: string, data: Partial<User>): Promise<Omit<User, 'password' | 'createdAt' | 'updatedAt'> | null> {
        const userDto = plainToInstance(UserValidator, data);
        const errors = await validate(userDto);
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn('Validation failed for update:user', { errors: errorMessages });
            throw new AppError(`Validation failed: ${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        let updateData = { ...data };
        if (data.password) {
        updateData.password = await bcrypt.hash(data.password, this.SALT_ROUNDS);
        logger.debug('Password hashed successfully for user update', { id });
        }
        return this.userService.update(id, updateData);
    }

    async deleteUser(id: string): Promise<User | null> {
        logger.debug('Deleting user', { id });
        const user = await this.userService.delete(id);
        if (user) {
            logger.info('User deleted successfully', { id });
        } else {
            logger.warn('User not found for deletion', { id });
        }
        return user;
    }

    async updateUserImage(id: string, imagePath: string): Promise<User | null> {
        logger.debug('Updating user image', { id, imagePath });
        const user = await this.userService.update(id, { imagePath });
        if (user) {
            logger.info('User image updated successfully', { id });
        } else {
            logger.warn('User not found for image update', { id });
        }
        return user;
    }
}   