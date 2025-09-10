import { DataSource, In, Repository } from 'typeorm';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { DefaultService } from "./DefaultService.js";
import { FormType } from "../models/model.js";
import { MaleDetails } from "../entities/MaleDetails.js";
import { Customer } from '../entities/Customer.js';
import { Reference } from '../entities/Reference.js';
import { logger } from '../utils/logger.js';
import { MaleMeasurement } from '../entities/MaleMeasurement.js';

export class MaleDetailService{
    private readonly maleDetailsRepository:Repository<MaleDetails>;
    private readonly customerRepository:Repository<Customer>;
    private readonly referenceRepository:Repository<Reference>;
    private readonly maleMeasurementRepository:Repository<MaleMeasurement>;
    private readonly ds:DefaultService;
    constructor(dataSource:DataSource){
        this.customerRepository = dataSource.getRepository(Customer);
        this.maleDetailsRepository = dataSource.getRepository(MaleDetails);
        this.referenceRepository = dataSource.getRepository(Reference);
        this.maleMeasurementRepository = dataSource.getRepository(MaleMeasurement);
        this.ds = new DefaultService(dataSource);
    }

    async save(details: MaleDetails[], method: string, userId: string,customerId:string): Promise<{ count: number; referenceId?: string }> {
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
                refName: FormType.MALE_FORM,
                addedBy: `${user.fullName} - ${company.companyName}`,
            } as Reference;
            
            return await this.referenceRepository.manager.transaction(async (transactionalEntityManager) => {
                const payload = this.referenceRepository.create(ref);
                const saveRef = await transactionalEntityManager.save(Reference, payload);
                if (!saveRef) {
                    throw new AppError('Failed to create reference', HttpStatus.INTERNAL_SERVER_ERROR);
                }

                const detailsWithRef = await Promise.all(details.map(async (detail) => {
                    const maleMeasurement = await this.maleMeasurementRepository.findOne({ where: { id: detail.maleMeasurementId}})
                    if (!maleMeasurement) {
                        throw new AppError(`Male measurement with ID ${detail.maleMeasurementId} not found`, HttpStatus.NOT_FOUND);
                    }
                    return this.maleDetailsRepository.create({
                        ...detail,
                        reference: saveRef,
                        user,
                        customer,
                        maleMeasurement,
                        addedBy: user.addedBy +' '+company.companyName
                    })
                }));

                await transactionalEntityManager.save(MaleDetails, detailsWithRef);
                return { count: detailsWithRef.length, referenceId: saveRef.id };
            });      
        } else if (method === 'PUT') {
            let updatedCount = 0;
            for (const detail of details) {
                const existingDetail = await this.maleDetailsRepository.findOne({
                    where: { 
                        id: detail.id, 
                        user: { id: userId }, 
                        customer: { id: customerId }, 
                        reference: { id: detail.referenceId }, 
                    },
                });
                if (existingDetail) {
                    await this.maleDetailsRepository.update(
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
                            maleMeasurement: { id: detail.maleMeasurementId }, 
                            reference: {id: detail.referenceId }, 
                        },
                    );
                    updatedCount++;
                }
            }
            if (updatedCount === 0) {
                throw new AppError('No details updated', HttpStatus.NOT_FOUND);
            }
            return { count: updatedCount };
        } else {
            throw new AppError('Invalid method. Use POST or PUT', HttpStatus.BAD_REQUEST);
        }
    }

    async deleteDetails(customerId: string, userId: string): Promise<number> {
        try {
            if (!customerId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }

            const deleteResult = await this.maleDetailsRepository.delete({
                customer: { id: customerId },
                user: { id: userId },
            });

            const remainingDetails = await this.maleDetailsRepository.count({
                where: { customer: { id: customerId } },
            });

            if (remainingDetails === 0) {
                const referenceDeleteResult = await this.referenceRepository.delete({
                    customer: { id: customerId },
                    user: { id: userId },
                });
                if (referenceDeleteResult.affected === 0) {
                    logger.warn('Reference not found for deletion', { customerId });
                }
            }

            return deleteResult.affected || 0;
        } catch (error) {
            logger.error('Failed to delete male details', { error, customerId, userId });
            throw error instanceof AppError
                ? error
                : new AppError('Failed to delete details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fetchAllDetailsByCustomer(customerId: string, userId: string) {
        try {
            const references = await this.referenceRepository.find({
                where: {
                    customer: { id: customerId }, 
                    user: { id: userId }, 
                }
            });

            const details = await this.maleDetailsRepository.find({
                where: { 
                    customer: { id: customerId }, 
                    user: { id: userId }, 
                    reference: { id: In(references.map((ref) => ref.id)) },
                },
                select: ['id', 'reference', 'maleMeasurement', 'measuredValue'],
                relations: { reference: true, maleMeasurement: true },
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });
            
            const data = details ? details.map(detail => ({
                id: detail.id,
                measuredValue: detail.measuredValue,
                referenceId: detail.reference?.id,
                maleMeasurement: detail.maleMeasurement ? { id: detail.maleMeasurement.id, name: detail.maleMeasurement.name } : null,
            })) : []

            return { count: details.length, data};
        } catch (error) {
            logger.error(error);
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fetchAllDetailsByRef(referenceId: string, userId: string) {
        try {
            if (!referenceId) {
                throw new AppError('Customer ID is required', HttpStatus.BAD_REQUEST);
            }
            if (!userId) {
                throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
            }

            const details = await this.maleDetailsRepository.find({
                where: { 
                    user: { id: userId }, 
                    reference: { id: referenceId },
                },
                select: ['id', 'reference', 'maleMeasurement', 'measuredValue'],
                relations: { reference: true, maleMeasurement: true },
                relationLoadStrategy: 'query',
                loadEagerRelations: false,
            });
            
            const data = details ? details.map(detail => ({
                id: detail.id,
                measuredValue: detail.measuredValue,
                referenceId: detail.reference?.id,
                maleMeasurement: detail.maleMeasurement ? { id: detail.maleMeasurement.id, name: detail.maleMeasurement.name } : null,
            })) : []

            return { count: details.length, data};
        } catch (error) {
            logger.error(error);
            throw error instanceof AppError
                ? error
                : new AppError('Failed to fetch details', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}