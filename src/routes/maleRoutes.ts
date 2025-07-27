import { MaleDetailController } from '@/controllers/maleDetailController';
import express from 'express';

const router = express.Router();

const controller = new MaleDetailController();
router.post('/', controller.createMany.bind(controller));
router.put('/', controller.createMany.bind(controller));
router.get('/:customerId', controller.getAllDetails.bind(controller));

export default router;