import { MaleDetails, Reference } from "generated/prisma";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/errors";
import { FormType } from "@/models/model";
import { HttpStatus } from "@/utils/constants";
import { DefaultService as ds } from "./DefaultService";

export class MaleDetailService{
    
async save(details: MaleDetails[], method: string, userId: string) {
    try {
        if (method === 'POST') {
            const user = await ds.getUser(userId)
            if (!user) {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
            const company = await ds.getCompany(user.id);
            if (!company) {
                throw new AppError('Company not found', HttpStatus.NOT_FOUND);
            }

            const ref = {
                userId,
                refName: FormType.MALE_FORM,
                customerId: details[0].customerId,
                addedBy: `${user.fullName} - ${company.companyName || ''}`
            } as Reference;

            const saveRef = await prisma.reference.create({ data: ref });
            if (!saveRef) {
                throw new AppError('Failed to create reference', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            const detailsWithRef = details.map(detail => ({
                ...detail,
                addedBy: user.fullName || null,
                referenceId: saveRef.id
            } as MaleDetails));

            const count = await prisma.maleDetails.createMany({ data: detailsWithRef });
            return { count: count.count, referenceId: saveRef.id };
        } else if (method === 'PUT') {
            const customerId = details[0].customerId;
            const updates = await Promise.all(details.map(async (detail) => {
                if (!detail.id) {
                    throw new AppError('Detail ID is required for update', HttpStatus.BAD_REQUEST);
                }
                return prisma.maleDetails.update({
                    where: {
                        id: detail.id,
                        userId,
                        customerId
                    },
                    data: detail
                });
            }));
            return { count: updates.length };
        } else {
            throw new AppError('Invalid method. Use POST or PUT.', HttpStatus.BAD_REQUEST);
        }
    } catch (error) {
        console.log(error)
        throw new AppError(
            error instanceof AppError ? error.message : 'Failed to save details',
            error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

async deleteDetails(referenceId: string, userId: string) {
    try {
        const deleteResult = await prisma.maleDetails.deleteMany({
            where: {
                AND: [
                    { userId },
                    { referenceId }
                ]
            }
        });
        const remainingDetails = await prisma.maleDetails.count({ where: { referenceId } });
        if (remainingDetails === 0) {
            await prisma.reference.delete({ where: { id: referenceId } });
        }
        return deleteResult.count;
    } catch (error) {
        throw new AppError(
            error instanceof AppError ? error.message : 'Failed to delete details',
            error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

async fetchAll(customerId: string, userId: string) {
    try {
        const details = await prisma.maleDetails.findMany({
            where: {
                AND: [
                    { userId },
                    { customerId }
                ]
            },
            include: {
                reference: {
                    select: { id: true, refName: true }
                },
                maleMeasurement: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!details || details.length === 0) {
            throw new AppError('No details found for the specified customer and user', HttpStatus.NOT_FOUND);
        }
        return { data: details, count: details.length };
    } catch (error) {
        throw new AppError(
            error instanceof AppError ? error.message : 'Failed to fetch details',
            error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
}