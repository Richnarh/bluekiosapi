import { Repository } from "typeorm";
import { promises as fs } from 'fs';
import { Company } from "../entities/Company.js";
import { User } from "../entities/User.js";
import { HttpStatus } from "../utils/constants.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { DataSource } from "typeorm/browser";

export class CompanyService {
    private readonly companyRepository: Repository<Company>
    constructor(dataSource:DataSource) {
        this.companyRepository = dataSource.getRepository(Company);
    }

    async createCompany(user: User, companyName: string) {
        try {
            if (!companyName) {
                throw new AppError('Company name is required', HttpStatus.BAD_REQUEST);
            }
            if (!user) {
                throw new AppError('User is required', HttpStatus.BAD_REQUEST);
            }

            const company = {
                companyName,
                addedBy: user.fullName || '',
                user,
            };
            const newCompany = this.companyRepository.create(company);
            const savedCompany = await this.companyRepository.save(newCompany);
            if (!savedCompany) {
                throw new AppError('Could not create company', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return savedCompany;
        } catch (error) {
            logger.error('Failed to create company', { error, userId: user.id, companyName });
            throw error instanceof AppError
                ? error
                : new AppError(`Could not create company: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async createPath(company: string): Promise<void> {
        try {
            if (!company) {
                throw new AppError('Company name is required', HttpStatus.BAD_REQUEST);
            }

            const dir = `public/uploads/${company.replace(/\s/g, '')}`;
            const exists = await fs.access(dir).then(() => true).catch(() => false);
            if (!exists) {
                await fs.mkdir(dir, { recursive: true });
            }
        } catch (error) {
            logger.error('Failed to create path', { error, company });
            throw error instanceof AppError
                ? error
                : new AppError('Could not create path', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}