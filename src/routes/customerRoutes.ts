import express from 'express';
import { CustomerController } from '@/controllers/customerController';

const router = express.Router();
const customerController = new CustomerController();

router.post('/', customerController.create.bind(customerController));
router.put('/', customerController.create.bind(customerController));
router.get('/', customerController.getAllCustomers.bind(customerController));
router.get('/:id', customerController.getCustomerById.bind(customerController));
router.delete('/:id', customerController.deleteImages.bind(customerController));

export default router;