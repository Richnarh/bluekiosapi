import bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserValidator } from '../utils/validators.js';
import { validate } from 'class-validator';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { AuthService } from './authService.js';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User.js';
import { CompanyService } from './companyService.js';
import { omit } from 'lodash-es';

export class UserService{
    private userRepository: Repository<User>;
    private authService:AuthService;
    private companyService:CompanyService;
    private SALT_ROUNDS = 10;
    
    constructor(dataSource: DataSource){
        this.userRepository = dataSource.getRepository(User);
        this.companyService = new CompanyService(dataSource);
        this.authService = new AuthService(dataSource);
    }

    async save(user:User, company:string){
        const hashPassword = await bcrypt.hash(user.password, this.SALT_ROUNDS);
        user.password = hashPassword;
        user.addedBy = user.fullName;
        user.updatedAt = new Date();
        const usr = this.userRepository.create(user);
        const newUser = await this.userRepository.save(usr);
        if(!newUser){
            throw new AppError('Could not create user', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const newCompany = await this.companyService.createCompany(newUser, company);
        await this.companyService.createPath(company);
        await this.authService.generateOtp(newUser);
        const userWithoutPassword = omit(user, ['password']);
        userWithoutPassword.id = newUser.id;

        const accessToken = this.authService.createAccessToken(newUser);
        const refreshToken = await this.authService.createRefreshToken(newUser.id);


        return { accessToken, refreshToken, user: {...userWithoutPassword, company: newCompany} };
    }

    async getUsers(): Promise<User[]> {
        try {
            return await this.userRepository.find({
                select: ['id', 'username', 'fullName', 'phoneNumber', 'emailAddress', 'isVerified'],
            });
        } catch (error) {
            throw new AppError(`Failed to fetch users: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserById(id: string){
         try {
            return await this.userRepository.findOne({
                where: { id },
                select: ['id', 'username', 'fullName', 'phoneNumber', 'emailAddress', 'isVerified'],
            });;
        } catch (error) {
            throw new AppError(`Failed to get user: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
            updateData.id = id;
            logger.debug('Password hashed successfully for user update', { id });
        }
        return this.userRepository.save(updateData);
    }

    async deleteUser(id: string){
        return await this.userRepository.delete(id);
    }
    
}   