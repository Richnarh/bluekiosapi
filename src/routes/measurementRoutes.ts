import express from 'express';
import { MeasurementController } from '../controllers/measurementController';

const router = express.Router();

const measurementController = new MeasurementController();

router.post('/', measurementController.addMeasurement.bind(measurementController));
router.put('/', measurementController.addMeasurement.bind(measurementController));
router.get('/', measurementController.getAllMeasurement.bind(measurementController));
router.get('/:char', measurementController.getActiveMeasurement.bind(measurementController));
router.get('/:id/:char', measurementController.getMeasurementById.bind(measurementController));
router.delete('/:id/:char', measurementController.deleteMeasurement.bind(measurementController));

export default router;