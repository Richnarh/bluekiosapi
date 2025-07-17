import express from 'express';
import { MeasurementController } from '../controllers/measurementController';

const router = express.Router();

const measurementController = new MeasurementController();

router.post('/', measurementController.addMeasurement.bind(measurementController));
router.put('/', measurementController.addMeasurement.bind(measurementController));
router.get('/', measurementController.getAllMeasurement.bind(measurementController));
router.get('/:id', measurementController.getMeasurementById.bind(measurementController));
router.delete('/:id', measurementController.deleteMeasurement.bind(measurementController));

export default router;