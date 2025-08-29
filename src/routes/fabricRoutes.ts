import { DataSource } from 'typeorm';
import { FabricController } from '../controllers/fabricController.js';
import express from 'express';

const router = express.Router();

export const setupFabricRoutes = (datasource:DataSource) => {
    const controller = new FabricController(datasource);
    router.post('/', controller.create.bind(controller));
    router.put('/', controller.create.bind(controller));
    router.get('/', controller.getAllFabric.bind(controller));
    router.get('/:id', controller.getFabricById.bind(controller));
    router.get('/:referenceId/:customerId', controller.getFabricsByRef.bind(controller));
    router.delete('/:id', controller.deleteFabricById.bind(controller));
    return router;
}