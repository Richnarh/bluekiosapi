import express from 'express';
import { AuthController } from '@/controllers/authController';

const router = express.Router();
const authController = new AuthController();

router.post('/', authController.loginUser.bind(authController));
router.post('/logout/:userId', authController.logoutUser.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/verify', authController.verifyOtp.bind(authController));
router.post('/request', authController.requestOtp.bind(authController));

export default router;