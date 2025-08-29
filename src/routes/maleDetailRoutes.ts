import express from 'express';
import { DataSource } from 'typeorm';
import { MaleDetailController } from '../controllers/maleDetailController.js';

const router = express.Router();

export const setupMaleDetailRoutes = (dataSource:DataSource) => {
    const controller = new MaleDetailController(dataSource);
    router.post('/:userId', controller.save.bind(controller));
    router.put('/:userId', controller.save.bind(controller));
    router.get('/:referenceId/refs', controller.fetchAll.bind(controller));
    router.delete('/:referenceId', controller.deleteDetails.bind(controller));
    return router;
}