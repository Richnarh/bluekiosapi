import express from 'express';
import { DataSource } from 'typeorm';
import { femaleMeasurementController } from '../controllers/femaleMeasurementController.js';

const router = express.Router();

export const setupFemaleMeasurement = (dataSource:DataSource) => {
    const measurementController = new femaleMeasurementController(dataSource);
    router.post('/', measurementController.save.bind(measurementController));
    router.put('/', measurementController.save.bind(measurementController));
    router.get('/', measurementController.getFemaleMeasurements.bind(measurementController));
    router.get('/active', measurementController.getActiveMeasurement.bind(measurementController));
    router.get('/:id/', measurementController.getFemaleMeasurementById.bind(measurementController));
    router.delete('/:id/', measurementController.deleteMeasurement.bind(measurementController));
    return router;
}
