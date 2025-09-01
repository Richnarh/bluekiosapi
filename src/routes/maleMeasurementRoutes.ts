import express from 'express';
import { DataSource } from 'typeorm'
import { MeasurementController } from '../controllers/maleMeasurementController.js';

const router = express.Router();

export const setupMaleMeasurement = (dataSource:DataSource) => {
    const measurementController = new MeasurementController(dataSource);

    router.post('/', measurementController.save.bind(measurementController));
    router.put('/', measurementController.save.bind(measurementController));
    router.get('/', measurementController.getAllMaleMeasurement.bind(measurementController));
    router.get('/active', measurementController.getActiveMaleMeasurement.bind(measurementController));
    router.get('/:id', measurementController.getMaleMeasurementById.bind(measurementController));
    router.delete('/:id', measurementController.deleteMeasurement.bind(measurementController));
    return router;
};