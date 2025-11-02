import { NextFunction, Request, Response } from "express";
import { MoreThan, Repository } from "typeorm";
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { DataSource } from "typeorm/browser";
import { AppError } from "../utils/errors.js";
import { HttpStatus } from "../utils/constants.js";
import { DefaultService } from "../services/DefaultService.js";
import { Form } from "../entities/Form.js";
import { FormType } from "../models/model.js";
import { Customer } from "../entities/Customer.js";
import { FemaleDetails } from "../entities/FemaleDetails.js";
import { MaleDetails } from "../entities/MaleDetails.js";
import { MaleDetailService } from "../services/maleDetailService.js";
import { FemaleDetailService } from "../services/femaleDetailService.js";
import { Company } from "../entities/Company.js";
import { Settings } from "../entities/Settings.js";

interface FormToken {
  userId: string;
  formType:FormType;
  token: string;
}

export class FormController{
    private readonly formRepository: Repository<Form>;
    private readonly customerRepository: Repository<Customer>;
    private readonly maleDetailService: MaleDetailService;
    private readonly femaleDetailService:FemaleDetailService;
    private readonly companyRepository:Repository<Company>;
    private readonly settingRepository:Repository<Settings>;
    private readonly ds:DefaultService;

    constructor(dataSource:DataSource){
        this.formRepository = dataSource.getRepository(Form);
        this.customerRepository = dataSource.getRepository(Customer);
        this.maleDetailService = new MaleDetailService(dataSource);
        this.femaleDetailService = new FemaleDetailService(dataSource);
        this.ds = new DefaultService(dataSource);
        this.companyRepository = dataSource.getRepository(Company);
        this.settingRepository = dataSource.getRepository(Settings);
    }

   async save(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, formType } = req.body;

      if (!userId) throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
      if (!formType) throw new AppError('FormType is required', HttpStatus.BAD_REQUEST);

      const existing = await this.formRepository.find({
        where: {
          user: { id: userId },
          formType: formType,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (existing.length > 0) {
        const maleUrl = existing.filter(item => item.formType === FormType.MALE_FORM).map(item => item.shortUrl);
        const femaleUrl = existing.filter(item => item.formType === FormType.FEMALE_FORM).map(item => item.shortUrl);
        res.status(HttpStatus.OK).json({ message: 'An active form link already exists for this user', data: { maleUrl, femaleUrl, expiresAt: existing[0].expiresAt }});
        return;
      }

      const id = crypto.randomUUID().replaceAll('-', '');
      const user = await this.ds.getUserById(userId);
      const token = this.generateFormToken(userId, formType);
      const hashedToken = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

      const fullUrl = `https://bluekios.netlify.app/forms?id=${id}&token=${token}`;

      const shortId = Math.random().toString(36).substring(2, 8);
      const shortUrl = `https://bluekios.netlify.app/forms/s/${shortId}`;

      const form = new Form();
      form.id = id;
      form.user = user!;
      form.formType = formType;
      form.token = hashedToken;
      form.expiresAt = expiresAt;
      form.url = fullUrl;
      form.shortId = shortId;
      form.shortUrl = shortUrl;

      const saved = await this.formRepository.save(form);

      res.status(HttpStatus.OK).json({ message: 'Form link generated successfully', data: { shortUrl: saved.shortUrl, expiresAt: saved.expiresAt }});
    } catch (error) {
        console.log(error);
      next(error);
    }
  }

  async saveForm(req: Request, res: Response, next: NextFunction){
    try {
        const form = req.body;

        const { customer, formType, maleDetails, femaleDetails, userId } = form;

        customer.user = await this.ds.getUserById(userId);
        const payload = this.customerRepository.create(customer as Customer);
        const custSave = await this.customerRepository.save(payload);


        const fType = this.getFormType(formType);
        const details = fType ? maleDetails as MaleDetails[] : femaleDetails as FemaleDetails[];
        let result;

        if(fType){
            result = await this.maleDetailService.save(details, req.method, userId, custSave.id);
        }else{
            result = await this.femaleDetailService.save(details, req.method, userId, custSave.id);
        }
        res.status(HttpStatus.CREATED).json({ data: { customerId:  custSave.id, referenceId:  result.referenceId} })
    } catch (error) {
        console.error(error);
        next(error);
    }
  }

  async findById(req: Request, res: Response, next:NextFunction){
    try {
        const { id } = req.params;
        if(!id) throw new AppError('Id is required', HttpStatus.BAD_REQUEST);
        const form = await this.formRepository.findOne({ where: { id }, relations:['user']});
        const company = await this.companyRepository.findOne({ where: { user: { id: form?.user?.id }}});
        const settings = await this.settingRepository.findOne({ where: { user: { id: form?.user?.id }}});
        res.status(HttpStatus.OK).json({ data: { userId: form?.user?.id, company, settings }});
    } catch (error) {
        next(error);
    }
  }

    async getUrl(req: Request, res: Response, next:NextFunction) {
       try {
         const form = await this.formRepository.findOne({ where: { shortId: req.params.id } });

        if (!form) {
             res.status(HttpStatus.NOT_FOUND).send('This link does not exist.');
             return;
        }
        if (form.expiresAt && form.expiresAt < new Date()) {
             res.status(410).send('This link has expired.');
             return;
        }
        res.status(HttpStatus.OK).json({data:{ url: form.url }});
       } catch (error) {
        next(error);
       }
    }

    async validateForm(req: Request, res: Response, next:NextFunction) {
        const { token } = req.query;
        let isValid = false;
        if (!token || typeof token !== 'string') {
            throw new AppError('Token is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const decoded = this.verifyToken(token);
            const hashToken = this.hashToken(token);
            const form = await this.formRepository.findOne({ where: { token: hashToken } });

            if (!form) {
                throw new AppError('Invalid or expired token', HttpStatus.NOT_FOUND);
            }

            if (form.expiresAt! < new Date()) {
                throw new AppError('Token is expired or already used', HttpStatus.BAD_REQUEST);
            }
            isValid = true;
            res.status(HttpStatus.OK).json({ message: 'Validate successful', isValid, userId: decoded.userId });
        } catch (error) {
            console.error(error);
            next(error);
        }
    }

    private generateFormToken(userId: string,formType:FormType): string {
        const payload: FormToken = {
            userId,
            formType,
            token: crypto.randomBytes(32).toString('hex'),
        };
        return jwt.sign(payload, process.env.JWT_SECRET || 'bluekiosk3', { expiresIn: '30d' });   
    }

    private verifyToken(token: string): FormToken {
        return jwt.verify(token, process.env.JWT_SECRET || 'bluekiosk3') as FormToken;
    }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getFormType(formType:FormType){
        return formType === FormType.MALE_FORM;
    }
}