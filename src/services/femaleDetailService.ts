import { DataSource, In, Repository } from 'typeorm';
import { FormType } from "../models/model.js";
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { FemaleDetails } from '../entities/FemaleDetails.js';
import { DefaultService } from './DefaultService.js';
import { Reference } from '../entities/Reference.js';
import { Customer } from '../entities/Customer.js';
import { FemaleMeasurement } from '../entities/FemaleMeasurement.js';

export class FemaleDetailService{
    private readonly femaleDetailsRepository:Repository<FemaleDetails>;
    private readonly referenceRepository:Repository<Reference>;
    private readonly customerRepository:Repository<Customer>;
    private readonly ds:DefaultService;
    private readonly femaleMeasurementRepository:Repository<FemaleMeasurement>;

    constructor(dataSource:DataSource){
        this.femaleDetailsRepository = dataSource.getRepository(FemaleDetails);
        this.customerRepository = dataSource.getRepository(Customer);
        this.referenceRepository = dataSource.getRepository(Reference);
        this.femaleMeasurementRepository = dataSource.getRepository(FemaleMeasurement);
        this.ds = new DefaultService(dataSource);
    }

    async save(details:FemaleDetails[], method:string, userId:string, customerId:string){
        if (!details.length) {
            throw new AppError('Details array cannot be empty', HttpStatus.BAD_REQUEST);
        }
        if (method === 'POST') {
            const user = await this.ds.getUserById(userId);
            if (!user) {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
            const company = await this.ds.getCompanyByUser(user.id);
            if (!company) {
                throw new AppError('Company not found', HttpStatus.NOT_FOUND);
            }
            const customer = await this.customerRepository.findOne({ where: { id: customerId } });
            if (!customer) {
                throw new AppError('Customer not found', HttpStatus.NOT_FOUND);
            }

            const ref = {
                user,
                customer,
                refName: FormType.FEMALE_FORM,
                addedBy: `${user.fullName} - ${company.companyName}`,
            } as Reference;

            return await this.referenceRepository.manager.transaction(async (transactionalEntityManager) => {
                const payload = this.referenceRepository.create(ref);
                const saveRef = await transactionalEntityManager.save(Reference, payload);
                if (!saveRef) {
                    throw new AppError('Failed to create reference', HttpStatus.INTERNAL_SERVER_ERROR);
                }

                const detailsWithRef = await Promise.all(details.map(async (detail) => {
                    const femaleMeasurement = await this.femaleMeasurementRepository.findOne({ where: { id: detail.femaleMeasurementId}})
                    if (!femaleMeasurement) {
                        throw new AppError(`Female measurement with ID ${detail.femaleMeasurementId} not found`, HttpStatus.NOT_FOUND);
                    }
                    return this.femaleDetailsRepository.create({
                        ...detail,
                        reference: saveRef,
                        user,
                        customer,
                        femaleMeasurement,
                        addedBy: user.addedBy +' '+company.companyName
                    })
                }));

                await transactionalEntityManager.save(FemaleDetails, detailsWithRef);
                return { count: detailsWithRef.length, referenceId: saveRef.id };
            });  
        } else if (method === 'PUT') {
            let updatedCount = 0;
            for (const detail of details) {
                const existingDetail = await this.femaleDetailsRepository.findOne({
                    where: { 
                        id: detail.id, 
                        user: { id: userId }, 
                        customer: { id: customerId }, 
                        reference: { id: detail.referenceId }, 
                    },
                });
                if (existingDetail) {
                    await this.femaleDetailsRepository.update(
                        { 
                            id: detail.id, 
                            user: { id: userId }, 
                            customer: { id: customerId } 
                        },
                        { 
                            id: detail.id,
                            measuredValue: Number(detail.measuredValue),
                            user: { id: userId}, 
                            customer: { id: customerId },
                            femaleMeasurement: { id: detail.femaleMeasurementId }, 
                            reference: {id: detail.referenceId }, 
                        },
                    );
                    updatedCount++;
                }
            }
            if (updatedCount === 0) {
                throw new AppError('No details updated', HttpStatus.NOT_FOUND);
            }
            return { count: updatedCount, referenceId: details[0]?.referenceId  };
        } else {
            throw new AppError('Invalid method. Use POST or PUT', HttpStatus.BAD_REQUEST);
        }
    }

    async getAllDetails(customerId: string, userId: string){
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
                    user: { id: userId }, 
                }
            })
            const details = await this.femaleDetailsRepository.find({
                where: { 
                    customer: { id: customerId },
                    user: { id: userId },
                    reference: { id: In(references.map(ref => ref.id)) }
                },
                select: ['id', 'user', 'customer', 'reference', 'femaleMeasurement', 'measuredValue'],
                relations: { reference: true, femaleMeasurement: true },
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });

            const data = details ? details.map(detail => ({
                id: detail.id,
                measuredValue: detail.measuredValue,
                referenceId: detail.reference?.id,
                femaleMeasurement: detail.femaleMeasurement ? { id: detail.femaleMeasurement.id, name: detail.femaleMeasurement.name } : null,
            })) : [];

            return { count: details.length, data };
        } catch (error) {
            logger.error(error);
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fetchAllDetailsByRef(referenceId: string, userId: string){
        try {
            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }
            
            const details = await this.femaleDetailsRepository.find({
                where: { 
                    user: { id: userId },
                    reference: { id: referenceId }
                },
                select: ['id', 'user', 'customer', 'reference', 'femaleMeasurement', 'measuredValue'],
                relations: { reference: true, femaleMeasurement: true },
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });

            const data = details ? details.map(detail => ({
                id: detail.id,
                measuredValue: detail.measuredValue,
                referenceId: detail.reference?.id,
                femaleMeasurement: detail.femaleMeasurement ? { id: detail.femaleMeasurement.id, name: detail.femaleMeasurement.name } : null,
            })) : [];

            return { count: details.length, data };
        } catch (error) {
            logger.error(error);
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    async deleteDetails(referenceId: string, userId: string): Promise<number> {
        try {
            if (!referenceId) {
                throw new AppError('Reference ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }

            const deleteResult = await this.femaleDetailsRepository.delete({
                user: { id: userId },
                reference: { id: referenceId },
            });

            const remainingDetails = await this.femaleDetailsRepository.count({
                where: { reference: { id: referenceId } },
            });

            if (remainingDetails === 0) {
                const referenceDeleteResult = await this.referenceRepository.delete({
                    id: referenceId,
                });
                if (referenceDeleteResult.affected === 0) {
                    logger.warn('Reference not found for deletion', { referenceId });
                }
            }
            return deleteResult.affected || 0;
        } catch (error) {
            logger.error('Failed to delete female details', { error, referenceId, userId });
            throw error instanceof AppError
                ? error
                : new AppError('Failed to delete details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}