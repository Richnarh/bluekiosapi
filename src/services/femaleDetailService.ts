import { FemaleDetails, Reference } from "generated/prisma";
import prisma from "@/config/prisma";
import { FormType } from "@/models/model";
import { AppError } from "@/utils/errors";
import { HttpStatus } from "@/utils/constants";
import { DefaultService as ds } from "./DefaultService";

export class FemaleDetailService{

    async save(details:FemaleDetails[], method:string, userId:string){
        let count;
        if(method === 'POST'){
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
                refName: FormType.FEMALE_FORM,
                customerId: details[0].customerId,
                addedBy: user?.fullName + ' - '+company.companyName || ""
            } as Reference;
            const saveRef = await prisma.reference.create({data:ref});
            if(!saveRef){
                throw new AppError('RefErr', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            details.forEach(detail => {
                detail.referenceId = saveRef.id;
            });
            count = await prisma.femaleDetails.createMany({ data: details });
        }else if(method === 'PUT'){
            count = await prisma.femaleDetails.updateMany({ 
                where: { 
                    AND: [
                        { userId },
                        { customerId: details[0].customerId }
                    ] 
                },
                data: details
            });
        }
    }
    
async deleteDetails(referenceId: string, userId: string) {
    try {
        const deleteResult = await prisma.femaleDetails.deleteMany({
            where: {
                AND: [
                    { userId },
                    { referenceId }
                ]
            }
        });
        const remainingDetails = await prisma.femaleDetails.count({ where: { referenceId } });
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

}