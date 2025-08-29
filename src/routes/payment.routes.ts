import { DataSource } from 'typeorm';
import { PaymentController } from '../controllers/paymentController.js';
import express from 'express';

const router = express.Router();

export const setupPaymentInfoRoutes = (dataSource: DataSource) => {
    const controller = new PaymentController(dataSource);
    router.post('/', controller.create.bind(controller));
    router.put('/', controller.create.bind(controller));
    router.get('/customer/:customerId', controller.getPaymentsByCustomer.bind(controller));
    router.get('/:referenceId/:customerId', controller.getPaymentsByReference.bind(controller));
    return router;
};