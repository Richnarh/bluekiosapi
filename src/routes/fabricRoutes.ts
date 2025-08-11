import { FabricController } from '@/controllers/fabricController';
import express from 'express';

const router = express.Router();

const controller = new FabricController();
router.post('/', controller.create.bind(controller));
router.put('/', controller.create.bind(controller));
router.get('/', controller.getAllFabric.bind(controller));
router.get('/:id', controller.getFabricById.bind(controller));
router.get('/:referenceId/:customerId', controller.getFabricsByRef.bind(controller));
router.delete('/:id', controller.deleteFabricById.bind(controller));

export default router;