import { DataSource, Repository } from "typeorm";
import { Reference } from "../entities/Reference.js";
import { DefaultService } from "./DefaultService.js";
import { AppError } from "../utils/errors.js";
import { HttpStatus } from "../utils/constants.js";
import { logger } from "../utils/logger.js";
import { User } from "../entities/User.js";
import { Customer } from "../entities/Customer.js";
import { FemaleDetails } from "../entities/FemaleDetails.js";
import { MaleDetails } from "../entities/MaleDetails.js";
import { FormType } from "../models/model.js";
import { Fabric } from "../entities/Fabric.js";

export class ReferenceService{
    private readonly referenceRepository: Repository<Reference>;
    private readonly maleDetailsRepository: Repository<MaleDetails>;
    private readonly femaleDetailsRepository: Repository<FemaleDetails>;
    private readonly customerRepository:Repository<Customer>;
    private readonly fabricRepository:Repository<Fabric>;
    private readonly ds:DefaultService;
        constructor(dataSource:DataSource){
            this.referenceRepository = dataSource.getRepository(Reference);
            this.customerRepository = dataSource.getRepository(Customer);
            this.maleDetailsRepository = dataSource.getRepository(MaleDetails);
            this.femaleDetailsRepository = dataSource.getRepository(FemaleDetails);
            this.fabricRepository = dataSource.getRepository(Fabric);
            this.ds = new DefaultService(dataSource);
        }

    async save(ref: any, userId: string): Promise<Reference> {
        try {
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }

            const user = await this.ds.getUserById(userId);
            if (!user) {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }

            if (!ref.customerId) {
                throw new AppError('CustomerId is required', HttpStatus.BAD_REQUEST);
            }
            const customer = await this.customerRepository.findOneBy({ id: ref.customerId })

            let reference: Reference;
            if (ref.id) {
                const existingRef = await this.referenceRepository.findOneBy({ id: ref.id });
                if (!existingRef) {
                    throw new AppError('Reference not found', HttpStatus.NOT_FOUND);
                }
                reference = { ...existingRef, ...ref, userId, user: { id: userId } as User, customer: { id: ref.customerId } as Customer };
            } else {
                reference = {
                    refName: ref.refName,
                    user,
                    customer,
                    addedBy: user.fullName || '',
                } as Reference;
            }

            const savedRef = await this.referenceRepository.save(reference);
            if (!savedRef) {
                throw new AppError('Failed to save reference', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return savedRef;
        } catch (error) {
            logger.error('Failed to save reference', { error, userId, ref });
            throw error instanceof AppError
                ? error
                : new AppError('Failed to save reference', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async getReferences(userId: string, customerId: string) {
        try {
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }

            const references = await this.referenceRepository.find({
                where: { 
                    user: { id: userId }, 
                    customer: { id: customerId }
                 },
                select: ['id', 'refName'],
                relations: ['fabric'],
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });

            const data = references.map(async reference => {
                const fabric = await this.fabricRepository.findOne({where: { reference: { id: reference.id }}});
                return {
                    id: reference.id,
                    refName: reference.refName,
                    fabric: fabric ? { id: fabric.id, fabricName: fabric.fabricName } : null,
                }
            });

            return { count: references.length, data };
        } catch (error) {
            logger.error(error);
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch references', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }   
    async getReferencesByCustomer(customerId:string, userId:string){
        const references = await this.referenceRepository.find({
            where: { 
                customer: { id: customerId },
                user: { id: userId } 
            },
            select: ['id', 'refName'],
            relationLoadStrategy: 'query',
        });
        const refs = references.map(async(ref) => {
            const fabric = await this.fabricRepository.findOne({ where: 
                { reference: { id: ref.id } }
            });
            return {...ref, fabric }
        });
        return Promise.all(refs);
    }
    async getReferencesByCustomer2(customerId: string, userId: string): Promise<{ count: number; data:any }> {
        try {
            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }
            const references = await this.referenceRepository.find({
                where: { 
                    customer: { id: customerId },
                    user: { id: userId } 
                },
                select: ['id', 'refName'],
            });

            const details = [];
            for (const reference of references) {
                if (reference.refName === FormType.MALE_FORM) {
                    const maleDetails = await this.maleDetailsRepository.find({
                        where: { reference: { id: reference.id } },
                        select: ['id', 'user', 'customer', 'reference', 'addedBy'],
                        relations: ['reference', 'maleMeasurement'],
                        relationLoadStrategy: 'query',
                        loadEagerRelations: false,
                    });
                    details.push(
                        ...maleDetails.map(detail => ({
                            ...detail,
                            reference: detail.reference ? { id: detail.reference.id, refName: detail.reference.refName } : null,
                            measurement: detail.maleMeasurement ? { id: detail.maleMeasurement.id, name: detail.maleMeasurement.name } : null,
                            type: 'male' as const,
                        })),
                    );
                } else if (reference.refName === FormType.FEMALE_FORM) {
                    const femaleDetails = await this.femaleDetailsRepository.find({
                        where: { reference: { id: reference.id } },
                        select: ['id', 'user', 'customer', 'reference', 'addedBy'],
                        relations: ['reference', 'femaleMeasurement'],
                        relationLoadStrategy: 'query',
                        loadEagerRelations: false,
                    });
                    details.push(
                        ...femaleDetails.map(detail => ({
                            ...detail,
                            reference: detail.reference ? { id: detail.reference.id, refName: detail.reference.refName } : null,
                            measurement: detail.femaleMeasurement ? { id: detail.femaleMeasurement.id, name: detail.femaleMeasurement.name } : null,
                            type: 'female' as const,
                        })),
                    );
                }
            }

            return { count: details.length, data: details };
        } catch (error) {
            logger.error('Failed to fetch references by customer', { error, customerId, userId });
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getRefById(id: string, userId?: string){
        try {
            if (!id) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            const reference = await this.referenceRepository.findOne({
                where: {
                    id,
                    user: { id: userId }
                },
                select: ['id', 'user', 'customer', 'refName', 'addedBy'],
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });

            if (!reference) {
                throw new AppError('Reference not found', HttpStatus.NOT_FOUND);
            }
            const fabric = await this.fabricRepository.findOne({ where: 
                { reference: { id: reference.id } }
            });
            return { ...reference, fabric:fabric ? { id: fabric.id, fabricName: fabric.fabricName } : null, };
        } catch (error) {
            logger.error('Failed to fetch reference by ID', { error, id, userId });
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch reference', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}