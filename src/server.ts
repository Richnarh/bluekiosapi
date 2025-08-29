import express from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import swaggerUi from 'swagger-ui-express';
import { initializeDatabase } from './config/dataSource.js';
import { logger } from './utils/logger.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import swaggerSpec from './swagger.json' with { type: 'json' };
import { setupAuthRoutes } from './routes/authRoutes.js';
import { setupUserRoutes } from './routes/userRoutes.js';
import { setupClothImageRoutes } from './routes/clothRoutes.js';
import { setupCustomerRoutes } from './routes/customerRoutes.js';
import { setupFabricRoutes } from './routes/fabricRoutes.js';
import { setupMaleMeasurement } from './routes/maleMeasurementRoutes.js';
import { setupFemaleMeasurement } from './routes/femaleMeasurementRoutes.js';
import { setupMaleDetailRoutes } from './routes/maleDetailRoutes.js';
import { setupFemaleDetailsRoutes } from './routes/femaleDetailRoutes.js';
import { setupPaymentInfoRoutes } from './routes/payment.routes.js';
import { setupReferenceRoutes } from './routes/referenceRoutes.js';
import { IsUniqueConstraint } from './utils/validators.js';

const createApp = async (): Promise<express.Application> => {
  const dataSource: DataSource = await initializeDatabase();

  const app = express();
  const baseApi = '/api/v1'
  const corsOptions = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'UserId'],
  };

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }))
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(`${baseApi}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use((req, res, next) => {
    logger.info(`${req.method} ${baseApi}${req.url}`);
    next();
  });

  const routeConfigs = {
    'auth': () => setupAuthRoutes(dataSource),
    'users': () => setupUserRoutes(dataSource),
    'cloth-images': () => setupClothImageRoutes(dataSource),
    'customers': () => setupCustomerRoutes(dataSource),
    'fabrics': () => setupFabricRoutes(dataSource),
    'male-measurements': () => setupMaleMeasurement(dataSource),
    'female-measurements': () => setupFemaleMeasurement(dataSource),
    'male-details': () => setupMaleDetailRoutes(dataSource),
    'female-details': () => setupFemaleDetailsRoutes(dataSource),
    'payments-info': () => setupPaymentInfoRoutes(dataSource),
    'references': () => setupReferenceRoutes(dataSource),
  };

  Object.entries(routeConfigs).forEach(([path, setup]) => {
    app.use(`${baseApi}/${path}`, setup());
  });
  app.use(errorMiddleware);
  IsUniqueConstraint.initialize(dataSource);
  return app;
};
const startEngine = async () => {
  const app = await createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger UI available at http://localhost:${PORT}/api/v1/docs`)
  });
}

startEngine().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});