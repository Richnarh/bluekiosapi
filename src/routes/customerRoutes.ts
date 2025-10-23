import express from 'express';
import { DataSource } from 'typeorm';
import { CustomerController } from '../controllers/customerController.js';

const router = express.Router();

export const setupCustomerRoutes = (datasource:DataSource) => {
    const customerController = new CustomerController(datasource);
    router.post('/', customerController.create.bind(customerController));
    router.put('/',customerController.create.bind(customerController));
    router.get('/',customerController.getAllCustomers.bind(customerController));
    router.get('/phone/:phoneNumber', customerController.checkPhoneExist.bind(customerController));
    router.get('/:id',customerController.getCustomerById.bind(customerController));
    router.delete('/:id', customerController.deleteImages.bind(customerController));
    return router;
}
