import express from 'express';
import { UserController } from '../controllers/userController.js';
import { DataSource } from 'typeorm';

const router = express.Router();
export const setupUserRoutes = (dataSource: DataSource) => {
    const userController = new UserController(dataSource);

    // router.post('/', userController.save.bind(userController));
    router.get('/', userController.getUsers.bind(userController));
    router.get('/:id', userController.getUserById.bind(userController));
    router.put('/:id', userController.updateUser.bind(userController));
    router.delete('/:id', userController.deleteUser.bind(userController));

  return router;
}

export default router;