import { ClothController } from '@/controllers/clothController';
import express, { Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import { DefaultService as ds } from '@/services/DefaultService';
import { AppError } from '@/utils/errors';
import { HttpStatus } from '@/utils/constants';

const router = express.Router();

const controller = new ClothController();

const storage = multer.diskStorage({
  destination: async (req:Request, file, cb) => {

    const userId = req.headers['userid']?.toString();
    if(!userId){
        throw new AppError('UserId is required in headers', HttpStatus.BAD_REQUEST);
    }
    const user = await ds.getUser(userId);
     if(!user){
        throw new AppError('User is required', HttpStatus.NOT_FOUND);
    }
    const company = await ds.getCompany(user.id);
     if(!company){
        throw new AppError('Company is required', HttpStatus.NOT_FOUND);
    }
    const imagePath = `public/uploads/${company.companyName.replace(/\s/g, "")}`;
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


router.post('/', upload.single('file'), controller.create.bind(controller));
router.put('/', upload.single('file'), controller.create.bind(controller));
router.get('/:customerId/:referenceId', controller.getImages.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;