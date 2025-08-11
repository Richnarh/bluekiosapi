import bcrypt from 'bcrypt';
import * as fs from 'fs';
import prisma from "@/config/prisma";
import { Company, User } from '../../generated/prisma';
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
    private crudUser:CrudService<User>;
    private authService:AuthService;
    
    constructor(){
        this.crudUser = new CrudService<User>(prisma.user);
        this.authService = new AuthService();
        this.emailService = new EmailService();
    }

    async addUser(user:User, company:string):Promise<Omit<User, 'password' | 'createdAt' | 'updatedAt'>>{
        const hashPassword = await bcrypt.hash(user.password, this.SALT_ROUNDS);

        console.log('user: ', user);
        
        user.password = hashPassword;
        user.addedBy = user.fullName;
        user.updatedAt = new Date();
        const newUser = await this.crudUser.create(user);
        if(!newUser){
            throw new AppError('Could not create user', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.createCompany(newUser, company);
        this.createPath(company);
        this.generateOtp(newUser);
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    private async createPath(company:string){
        if(!fs.existsSync(`public/uploads/${company.replace(/\s/g, "")}`)){
            fs.mkdirSync(`public/uploads/${company.replace(/\s/g, "")}`, { recursive: true })
        }
    }
    
    public generateOtp = async(user:User) => {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await this.authService.createOtp(user.id, otpCode);
      if(user.emailAddress){
          await this.emailService.sendOtpEmail(user.emailAddress, otpCode);
      }
      if(user.phoneNumber){
        // await this.smsService.sendSms(user.phoneNumber, otpCode);
      }
    }
    
    private createCompany = async (user:User, companyName:string) => {
        try {
            const company = {
                companyName,
                addedBy: user.fullName,
                userId: user.id,
                updatedAt: new Date(),
            } as Company;
            await prisma.company.create({ data: company });
        } catch (error) {
            throw new AppError('Could not create company', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUsers(): Promise<Omit<User, 'password'>[]> {
        const users = await this.crudUser.findMany();
        const newUsers = users.map(({ password, ...user }) => user);
        return newUsers;
    }

    async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
        const u = await this.crudUser.findUnique(id);
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
        return this.crudUser.update(id, updateData);
    }

    async deleteUser(id: string): Promise<User | null> {
        logger.debug('Deleting user', { id });
        const user = await this.crudUser.delete(id);
        if (user) {
            logger.info('User deleted successfully', { id });
        } else {
            logger.warn('User not found for deletion', { id });
        }
        return user;
    }
    
}   