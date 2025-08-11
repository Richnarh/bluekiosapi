import { FemaleDetailController } from '@/controllers/femaleDetailController';
import express from 'express';

const router = express.Router();

const controller = new FemaleDetailController();
router.post('/', controller.createMany.bind(controller));
router.get('/:referenceId/refs', controller.getAllDetails.bind(controller));
router.delete('/:referenceId', controller.deleteDetails.bind(controller));

export default router;