import { PaymentController } from '@/controllers/paymentController';
import express from 'express';

const router = express.Router();

const controller = new PaymentController();
router.post('/', controller.create.bind(controller));
router.put('/', controller.create.bind(controller));
router.get('/customer/:customerId', controller.getPaymentsByCustomer.bind(controller));
router.get('/:referenceId/:customerId', controller.getPaymentsByReference.bind(controller));

export default router;