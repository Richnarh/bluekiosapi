import { Router } from 'express';
import authRoutes from './authRoute';
import userRoutes from './userRoute';
import customerRoute from './customerRoute';
import measurementRoute from './measurementRoute';


const routes: { [key: string]: Router } = {
  users: userRoutes,
  auth: authRoutes,
  customers: customerRoute,
  measurement: measurementRoute
};

export default routes;  