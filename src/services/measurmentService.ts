import { FemaleMeasurement, MaleMeasurement } from "generated/prisma";
import { CrudService } from "./crudservice";
import prisma from "@/config/prisma";
import { MeasurementValidator } from "@/utils/validators";
import { plainToInstance } from "class-transformer";
import { isEmpty, validate } from "class-validator";
import { logger } from '@/utils/logger';
import { AppError } from "@/utils/errors";
import { HttpStatus } from "@/utils/constants";

export class MeasurementService{
    private maleCrud: CrudService<MaleMeasurement>;
    private femaleCrud: CrudService<FemaleMeasurement>;

    constructor(){
        this.maleCrud = new CrudService<MaleMeasurement>(prisma.maleMeasurement);
        this.femaleCrud = new CrudService<MaleMeasurement>(prisma.femaleMeasurement);
    }

    async addMaleMeasurement(male:MaleMeasurement){
        const dto = plainToInstance(MeasurementValidator, male);
        const errors = await validate(dto);
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn({ errors: errorMessages });
            throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        let result:any | undefined;
        if(!isEmpty(male.id)){
            result = await this.maleCrud.update(male.id,male)
        }else{
            result = await this.maleCrud.create(male);
        }
        return result;
    }

    async addFemaleMeasurement(female:FemaleMeasurement){
        const dto = plainToInstance(MeasurementValidator, female);
        const errors = await validate(dto);
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn({ errors: errorMessages });
            throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        let result:any | undefined;
        if(!isEmpty(female.id)){
            result = await this.femaleCrud.update(female.id,female)
        }else{
            result = await this.femaleCrud.create(female);
        }
        return result;
    }

    async getAllMaleMeasurement(){
        return await this.maleCrud.findMany();;
    }

    async getAllFemaleMeasurement(){
        return await this.femaleCrud.findMany();
    }

    async getMaleById(id: string): Promise<MaleMeasurement | null> {
        return await this.maleCrud.findUnique(id);
    }

    async getFemaleById(id: string): Promise<FemaleMeasurement | null> {
        return await this.femaleCrud.findUnique(id);
    }
    
    async deleteMale(id: string): Promise<MaleMeasurement | null> {
        return await this.maleCrud.delete(id);
    }
    
    async deleteFemale(id: string): Promise<FemaleMeasurement | null> {
        return await this.femaleCrud.delete(id);
    }
}