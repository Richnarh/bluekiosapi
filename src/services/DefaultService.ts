import { DataSource, Repository } from 'typeorm';
import { User } from "../entities/User.js";
import { Company } from '../entities/Company.js';

export class DefaultService{
    private userRepository: Repository<User>;
    private companyRepository: Repository<Company>;
    constructor(dataSource: DataSource) {
        this.userRepository = dataSource.getRepository(User);
        this.companyRepository = dataSource.getRepository(Company);
    }
    public getUserById = async (id: string) => await this.userRepository.findOne({ where: { id }})
    public getCompanyByUser = async (id:string) => await this.companyRepository.findOne({ where: { user: { id  }}})
}