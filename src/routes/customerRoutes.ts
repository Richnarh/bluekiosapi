import express from 'express';
import { DataSource } from 'typeorm';
import { CustomerController } from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

export const setupCustomerRoutes = (datasource:DataSource) => {
    const customerController = new CustomerController(datasource);
    router.post('/', authMiddleware, customerController.create.bind(customerController));
    router.put('/', authMiddleware,customerController.create.bind(customerController));
    router.get('/', authMiddleware,customerController.getAllCustomers.bind(customerController));
    router.get('/:id', authMiddleware,customerController.getCustomerById.bind(customerController));
    router.delete('/:id', authMiddleware, customerController.deleteImages.bind(customerController));
    return router;
}
