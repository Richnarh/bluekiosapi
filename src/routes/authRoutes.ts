import express from 'express';
import { DataSource } from 'typeorm';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();
export const setupAuthRoutes = (dataSource: DataSource) => {
    const authController = new AuthController(dataSource);

    router.post('/register', authController.registerUser.bind(authController));
    router.post('/login', authController.loginUser.bind(authController));
    router.get('/checkusername/:username', authController.checkUsername.bind(authController));
    router.post('/logout/:userId', authController.logoutUser.bind(authController));
    router.post('/refresh', authController.refreshToken.bind(authController));
    router.post('/verify-otp', authController.verifyOtp.bind(authController));
    router.post('/request', authController.requestOtp.bind(authController));

  return router;
}