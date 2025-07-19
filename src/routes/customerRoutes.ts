import express, { Request} from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { authMiddleware } from '@/middleware/authMiddleware';
import { CustomerController } from '@/controllers/customerController';
import fs from 'fs';

const router = express.Router();
const customerController = new CustomerController();

const storage = multer.diskStorage({
  destination: (req:Request, file, cb) => {
    const pathname = req.body.pathname;
    if (!pathname) {
      return cb(new Error('Pathname is required'), '');
    }

    fs.mkdirSync(`public/uploads/${pathname}`, { recursive: true });
    cb(null, `public/uploads/${pathname}`);
  },
  filename: (req:Request, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    cb(null, `customer-${req.params.id}-${uniqueSuffix}${ext}`);
  },
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

router.post('/', customerController.addCustomer.bind(customerController));
router.post('/:id/upload', authMiddleware, upload.single('image'), customerController.uploadImage.bind(customerController));
// router.get('/details', authMiddleware, customerController.)

export default router;