import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserController } from '@/controllers/userController';

const router = express.Router();
const userController = new UserController();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `user-${req.params.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG images are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/', userController.createUser.bind(userController));

// Protected routes (require JWT)
router.post('/:id/upload', authMiddleware, upload.single('image'), userController.uploadImage.bind(userController));

router.get('/', authMiddleware, userController.getUsers.bind(userController));
router.get('/:id', authMiddleware, userController.getUserById.bind(userController));
router.put('/:id', authMiddleware, userController.updateUser.bind(userController));
router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

export default router;