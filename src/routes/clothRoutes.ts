import { ClothController } from '../controllers/clothController.js';
import express, { Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import { DefaultService, DefaultService as ds } from '../services/DefaultService.js';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';
import { DataSource } from 'typeorm';

const router = express.Router();

export const setupClothImageRoutes = (dataSource: DataSource) => {
  const controller = new ClothController(dataSource);
  const ds = new DefaultService(dataSource);

const storage = multer.diskStorage({
   destination: async (req:Request, file, cb) => {

    const userId = req.headers['userid']?.toString();
    if(!userId){
        throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
    }
    const user = await ds.getUserById(userId);
     if(!user){
        throw new AppError('User is required', HttpStatus.NOT_FOUND);
    }
    const company = await ds.getCompanyByUser(user.id);
     if(!company){
        throw new AppError('Company is required', HttpStatus.NOT_FOUND);
    }
    const imagePath = `public/uploads/${company.companyName?.replace(/\s/g, "")}`;
    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(imagePath, { recursive: true });
    }
    cb(null, imagePath);
  },
  filename: (req:Request, file, cb) => cb(null, file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG,JPG & PNG images are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

  router.post('/', upload.single('file'), controller.create.bind(controller));
  router.put('/', upload.single('file'), controller.create.bind(controller));
  router.get('/:customerId/:referenceId', controller.getImage.bind(controller));
  router.delete('/:id', controller.delete.bind(controller));

  return router;
}

export default router;