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

interface FormTokenPayload {
  userId: string;
  token: string;
}

export class FormController{
    private readonly formRepository: Repository<Form>;
    private readonly ds:DefaultService;

    constructor(dataSource:DataSource){
        this.formRepository = dataSource.getRepository(Form);
        this.ds = new DefaultService(dataSource);
    }

   async save(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, formType } = req.body;

      if (!userId) throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
      if (!formType) throw new AppError('FormType is required', HttpStatus.BAD_REQUEST);

      const existing = await this.formRepository.find({
        where: {
          user: { id: userId },
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
      const token = this.generateFormToken(userId);
      const hashedToken = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

      const fullUrl = `https://bluekios.netlify.app/forms?id=${id}&token=${token}`;

      const shortId = Math.random().toString(36).substring(2, 8);
      const shortUrl = `http:localhost:4200/forms/s/${shortId}`;

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

    async updateForm(req:Request, res:Response, next:NextFunction){
        try {
            const { userId, formId } = req.body;
            if(!userId){
                throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
            }
            if(!formId){
                throw new AppError('FormId is required', HttpStatus.BAD_REQUEST);
            }
            
            const form = await this.formRepository.findOne({ where: { id: formId }});
            if(!form){
                throw new AppError('Form not found', HttpStatus.NOT_FOUND);
            }
            // form.used = true;
            this.formRepository.save(form);
            res.status(HttpStatus.OK).json({ message: 'Form is updated', expiresAt: form.expiresAt });
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

    private generateFormToken(userId: string): string {
        const payload: FormTokenPayload = {
            userId,
            token: crypto.randomBytes(32).toString('hex'),
        };
        return jwt.sign(payload, process.env.JWT_SECRET || 'bluekiosk3', { expiresIn: '30d' });   
    }

    private verifyToken(token: string): FormTokenPayload {
        return jwt.verify(token, process.env.JWT_SECRET || 'bluekiosk3') as FormTokenPayload;
    }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}