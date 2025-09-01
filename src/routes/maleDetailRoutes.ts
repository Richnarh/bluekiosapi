import express from 'express';
import { DataSource } from 'typeorm';
import { MaleDetailController } from '../controllers/maleDetailController.js';

const router = express.Router();

export const setupMaleDetailRoutes = (dataSource:DataSource) => {
    const controller = new MaleDetailController(dataSource);
    router.post('/:customerId', controller.saveAllDetailsBycustomerId.bind(controller));
    router.put('/:customerId', controller.saveAllDetailsBycustomerId.bind(controller));
    router.get('/:customerId/details', controller.fetchMaleDetailsByCustomerId.bind(controller));
    router.delete('/:referenceId', controller.deleteDetails.bind(controller));
    return router;
}