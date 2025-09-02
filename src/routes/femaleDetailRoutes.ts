import { DataSource } from 'typeorm';
import express from 'express';
import { FemaleDetailController } from '../controllers/femaleDetailController.js';

const router = express.Router();

export const setupFemaleDetailsRoutes = (dataSource:DataSource) =>{
    const controller = new FemaleDetailController(dataSource);
    router.post('/:customerId', controller.saveAllDetailsBycustomerId.bind(controller));
    router.put('/:customerId', controller.saveAllDetailsBycustomerId.bind(controller));
    router.get('/:customerId/details', controller.fetchFemaleDetailsByCustomerId.bind(controller));
    router.get('/:referenceId/references', controller.fetchFemaleDetailsByReferenceId.bind(controller));
    router.delete('/:referenceId', controller.deleteDetails.bind(controller));
    return router;
}