import express from 'express';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserController } from '@/controllers/userController';

const router = express.Router();
const userController = new UserController();

router.post('/', userController.createUser.bind(userController));
router.get('/', authMiddleware, userController.getUsers.bind(userController));
router.get('/:id', authMiddleware, userController.getUserById.bind(userController));
router.put('/:id', authMiddleware, userController.updateUser.bind(userController));
router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

export default router;