import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { UserController } from '../controllers/userController.js';
import { DataSource } from 'typeorm';

const router = express.Router();
export const setupUserRoutes = (dataSource: DataSource) => {
    const userController = new UserController(dataSource);

    router.post('/', userController.save.bind(userController));
    router.get('/', authMiddleware, userController.getUsers.bind(userController));
    router.get('/:id', authMiddleware, userController.getUserById.bind(userController));
    router.put('/:id', authMiddleware, userController.updateUser.bind(userController));
    router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

  return router;
}

export default router;