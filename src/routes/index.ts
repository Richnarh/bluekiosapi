import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import customerRoutes from './customerRoutes';
import measurementRoutes from './measurementRoutes';
import maleRoutes from './maleRoutes';
import femaleDetails from './femaleRoutes';
import ref from './referenceRoutes';
import payment from './payment.routes';

const routes: { [key: string]: Router } = {
  users: userRoutes,
  auth: authRoutes,
  customers: customerRoutes,
  measurements: measurementRoutes,
  femaleDetails: femaleDetails,
  maleDetails: maleRoutes,
  references: ref,
  payments: payment
};

export default routes;  