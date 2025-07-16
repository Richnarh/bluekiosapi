import express from 'express';
import { MeasurementController } from '../controllers/measurementController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

const measurementController = new MeasurementController();

router.post('/', authMiddleware, measurementController.addMale.bind(measurementController));
router.put('/', authMiddleware, measurementController.addMale.bind(measurementController));
router.get('/male', authMiddleware, measurementController.getAllMale.bind(measurementController));
router.get('/male/:id', authMiddleware, measurementController.getMaleById.bind(measurementController));
router.delete('/male/:id', authMiddleware, measurementController.deleteMale.bind(measurementController));

router.post('/female', authMiddleware, measurementController.addFemale.bind(measurementController));
router.put('/female', authMiddleware, measurementController.addFemale.bind(measurementController));
router.get('/female', authMiddleware, measurementController.getAllFemale.bind(measurementController));
router.get('/female/:id', authMiddleware, measurementController.getFemaleById.bind(measurementController));
router.delete('/female/:id', authMiddleware, measurementController.deleteFemale.bind(measurementController));

export default router;