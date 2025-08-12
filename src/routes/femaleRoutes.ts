import { FemaleDetailController } from '@/controllers/femaleDetailController';
import express from 'express';

const router = express.Router();

const controller = new FemaleDetailController();
router.post('/:userId', controller.createMany.bind(controller));
router.put('/:userId', controller.createMany.bind(controller));
router.get('/:referenceId/refs', controller.getAllDetails.bind(controller));
router.delete('/:referenceId', controller.deleteDetails.bind(controller));

export default router;