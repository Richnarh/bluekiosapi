import { DataSource } from 'typeorm';
import { FemaleDetailController } from '../controllers/femaleDetailController.js';
import express from 'express';

const router = express.Router();

export const setupFemaleDetailsRoutes = (dataSource:DataSource) =>{
    const controller = new FemaleDetailController(dataSource);
    router.post('/:userId', controller.createMany.bind(controller));
    router.put('/:userId', controller.createMany.bind(controller));
    router.get('/:customerId/details', controller.fetchFemaleDetailsByCustomerId.bind(controller));
    router.delete('/:referenceId', controller.delete.bind(controller));
    return router;
}