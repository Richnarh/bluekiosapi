import { DataSource, Repository } from 'typeorm';
import { User } from "../entities/User.js";
import { Company } from '../entities/Company.js';
import { Customer } from '../entities/Customer.js';
import { Reference } from '../entities/Reference.js';

export class DefaultService{
    private userRepository: Repository<User>;
    private companyRepository: Repository<Company>;
    private customerRepository: Repository<Customer>;
    private referenceRepository: Repository<Reference>;
    constructor(dataSource: DataSource) {
        this.userRepository = dataSource.getRepository(User);
        this.companyRepository = dataSource.getRepository(Company);
        this.customerRepository = dataSource.getRepository(Customer);
        this.referenceRepository = dataSource.getRepository(Reference);
    }
    public getUserById = async (id: string) => await this.userRepository.findOne({ where: { id }})
    public getCustomerById = async (id:string) => await this.customerRepository.findOne({ where: { id }})
    public getReferenceById = async (id:string) => await this.referenceRepository.findOne({ where: { id }})
    public getCompanyByUser = async (id:string) => await this.companyRepository.findOne({ where: { user: { id  }}})
}