import { MaleDetails, Reference } from "generated/prisma";
import { CrudService } from "./crudservice";
import prisma from "@/config/prisma";
import { AppError } from "@/utils/errors";
import { FormType } from "@/models/model";
import { HttpStatus } from "@/utils/constants";

export class MaleDetailService{
    private maleService:CrudService<MaleDetails>;
    constructor(){
        this.maleService = new CrudService<MaleDetails>(prisma.maleDetails);
    }

    async save(details:MaleDetails[], method:string, userId:string){
        let count;
        if(method === 'POST'){
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const ref = {
                userId,
                refName: FormType.MALE_FORM,
                description: "",
                customerId: details[0].customerId,
                addedBy: user?.fullName + ' - '+user?.companyName || ""
            } as Reference;
            const saveRef = await prisma.reference.create({data:ref});
            if(!saveRef){
                throw new AppError('RefErr', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            details.forEach(detail => {
                detail.referenceId = saveRef.id;
            });
            count = await prisma.maleDetails.createMany({ data: details });
        }else if(method === 'PUT'){
            count = await prisma.maleDetails.updateMany({ 
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

    async getAllMaleDetails(): Promise<any[]> {
        return this.maleService.findMany();
    }
}