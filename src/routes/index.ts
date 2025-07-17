import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import customerRoutes from './customerRoutes';
import measurementRoutes from './measurementRoutes';


const routes: { [key: string]: Router } = {
  users: userRoutes,
  auth: authRoutes,
  customers: customerRoutes,
  measurements: measurementRoutes,
};

export default routes;  