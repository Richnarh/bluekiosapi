import { FemaleMeasurement, MaleMeasurement, MeasureType } from "generated/prisma";
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

    public async create(measurement:any){
        const dto = plainToInstance(MeasurementValidator, measurement);
        const errors = await validate(dto);
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn({ errors: errorMessages });
            throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        let male:any | undefined;
        let female:any | undefined;
        if(measurement.male){
            male = await this.saveMale(measurement);
        }
        if(measurement.female){
            female = await this.saveFemale(measurement);
        }
        return { maleMeasurement: male, femaleMeasurement: female };
    }

    private async saveMale(measurement:any){
        let result:MaleMeasurement | null;
        const { male,female, ...rest } = measurement;
        const payload = { ...rest, measureType: MeasureType.DEFAULT_TYPE } as MaleMeasurement;
        if(!isEmpty(payload.id)){
            result = await this.maleCrud.update(payload.id,payload)
        }else{
            result = await this.maleCrud.create(payload);
        }
        return result;
    }

    private async saveFemale(measurement:any){
        let result:FemaleMeasurement | null;
        const { male,female, ...rest } = measurement;
        const payload = { ...rest, measureType: MeasureType.DEFAULT_TYPE } as FemaleMeasurement;
        if(!isEmpty(payload.id)){
            result = await this.femaleCrud.update(payload.id,payload)
        }else{
            result = await this.femaleCrud.create(payload);
        }
        return result;
    }

    async getAllMaleMeasurement(){
        const male =  await this.maleCrud.findMany();
        const female =  await this.femaleCrud.findMany();

        return { maleMeasurement:male, femaleMeasurement:female };
    }

    async getAllFemaleMeasurement(){
        return await this.femaleCrud.findMany();
    }

    async getMeasurementById(id: string, char:string): Promise<MaleMeasurement | FemaleMeasurement | null> {
        if(char == 'M'){
            return await this.maleCrud.findUnique(id);
        }
        return await this.femaleCrud.findUnique(id);
    }

    async getActiveMeasurement(char: string){
        if(char == 'M'){
            return await prisma.maleMeasurement.findMany({
                where: {
                    status: true
                }
            });
        }
        return await prisma.femaleMeasurement.findMany({
                where: {
                    status: true
                }
            });
    }

    async deleteMeasurement(id: string, char:string): Promise<MaleMeasurement | FemaleMeasurement | null> {
        if(char == 'M'){
            return await this.maleCrud.delete(id);
        }
        return await this.femaleCrud.delete(id);
    }
}