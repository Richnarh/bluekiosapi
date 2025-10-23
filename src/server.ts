import express, { NextFunction,Request,Response } from 'express';
import { DataSource } from 'typeorm';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import { initializeDatabase } from './config/dataSource.js';
import { logger } from './utils/logger.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import swaggerDocument from './swagger.json' with { type: 'json' };
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
import { authMiddleware } from './middleware/authMiddleware.js';

const baseApi = `/api/v1`;

const createApp = async (): Promise<express.Application> => {
  const dataSource: DataSource = await initializeDatabase();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();

  const allowedOrigins = [
    'http://localhost:4200',           
    'https://bluekios.netlify.app',    
    'https://194.163.144.61'
  ];

  const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  };

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }))
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use((req, res, next) => {
    if (req.path === '/api/v1/api-docs' || req.path.startsWith('/api/v1/docs')) {
      return next();
    }
    next();
  });
  app.use(`${baseApi}/docs`, express.static(path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist')));
  app.use(
    `${baseApi}/api-docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCssUrl: `${baseApi}/docs/swagger-ui.css`,
      customJs: [
        `${baseApi}/docs/swagger-ui-bundle.js`,
        `${baseApi}/docs/swagger-ui-standalone-preset.js`
      ]
    })
  );
  app.use(`/uploads/:company`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { company } = req.params;
      const sanitizedCompany = company.replace(/\s/g, '');
      req.url = req.path.replace(`/uploads/${sanitizedCompany}`, '');
      const staticPath = path.join(__dirname, `../public/uploads/${sanitizedCompany}`);
      express.static(staticPath)(req, res, next);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).send('Internal server error');
      next(error);
    }
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    const publicRoutes = [
      `${baseApi}/auth/login`, 
      `${baseApi}/auth/register`,
      new RegExp(`^${baseApi}/auth/checkusername/[^/]+$`)
    ]
    const isPublicRoute = publicRoutes.some(route => {
      if (typeof route === 'string') {
        return route === req.path;
      } else {
        return route.test(req.path);
      }
    });
  
    if (isPublicRoute) {
      return next();
    }
    return authMiddleware(req, res, next);
  })

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
  const PORT = process.env.PORT || 3500;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger UI available at http://localhost:${PORT}${baseApi}/docs`)
  });
}

startEngine().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});