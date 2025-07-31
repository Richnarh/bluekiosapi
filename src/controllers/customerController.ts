import prisma from "@/config/prisma";
import { CustomerService } from "@/services/customerService";
import { HttpStatus } from "@/utils/constants";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { NextFunction, Request, Response } from "express"
import { ClothImage, Customer } from "generated/prisma";
import { ulid } from "ulid";

export class CustomerController{
    private customerService:CustomerService;

    constructor(){
        this.customerService = new CustomerService();
    }

    async create(req:Request, res:Response, next:NextFunction){
        try {
            const customer = req.body as Customer;
            const result = await this.customerService.create(customer);
            res.status(customer.id ? HttpStatus.OK : HttpStatus.CREATED).json({
                message: `${customer.fullName} ${customer.id ? 'updated' : 'added'} successfully.`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllCustomers(req:Request, res:Response, next:NextFunction){
        try {
            const userId = req.headers['userid']?.toString();
            const result = await prisma.customer.findMany({ where: { userId } })
            res.status(HttpStatus.OK).json({
                count: result.length,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getCustomerById(req:Request, res:Response, next:NextFunction){
        try {
            const { id } = req.params;
            const customer = await prisma.customer.findUnique({ where: { id }});
            if (customer) {
                res.status(HttpStatus.OK).json({ data:customer });
            } else {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            next(error);
        }
    }

  async uploadImage(req: Request, res: Response, next: NextFunction) {
       try {
        const { id } = req.params;
        const { customerId } = req.body;
        const userId = req.headers['userid']?.toString();
        if (!req.file) {
          logger.warn('No file uploaded', { userId: id });
          throw new AppError('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          logger.warn('Invalid file type', { userId: id, mimetype: req.file.mimetype });
          throw new AppError('Only JPEG or PNG images are allowed', HttpStatus.BAD_REQUEST);
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          logger.warn('File size exceeds limit', { userId: id, size: req.file.size });
          throw new AppError('File size exceeds 5MB limit', HttpStatus.BAD_REQUEST);
        }

        const payload = {
            imageUrl: `/uploads/${req.file.filename}`,
            id: !id == undefined ? ulid() : id,
            customerId: customerId,
            userId: userId,
        } as ClothImage;

        const result = await prisma.clothImage.create({ data: payload })
        if(!result){
            throw new AppError('Could not upload image', HttpStatus.BAD_REQUEST);
        }

        logger.info('Image uploaded successfully', { userId: id, imagePath: payload.imageUrl });
        res.status(HttpStatus.OK).json({
          message: 'Image uploaded successfully',
          result,
        });
      } catch (error) {
        next(error);
      }
    }
}