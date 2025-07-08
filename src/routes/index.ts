import authRoutes from './authRoute';
import userRoutes from './userRoute';
import customerRoute from './customerRoute';

import { Router } from 'express';

const routes: { [key: string]: Router } = {
  users: userRoutes,
  auth: authRoutes,
  customers: customerRoute
};

export default routes;  