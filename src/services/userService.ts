import bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserValidator } from '../utils/validators.js';
import { validate } from 'class-validator';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User.js';

export class UserService{
    private userRepository: Repository<User>;
    private SALT_ROUNDS = 10;
    
    constructor(dataSource: DataSource){
        this.userRepository = dataSource.getRepository(User);
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