import express, { Application } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors'
import { fileURLToPath } from 'url';
import { errorMiddleware }  from '@/middleware/errorMiddleware';
import { logger } from '@/utils/logger';
import routes from './routes';

const app: Application = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseApi = '/api/v1'
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Userid'],
};

dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use(helmet());
app.use(cors(corsOptions));

// app.use(`${baseApi}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(`${baseApi}/uploads`, express.static(path. join(__dirname, '../public/uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

Object.entries(routes).forEach(([prefix, router]) => {
  console.log(`${baseApi}/${prefix}`)
  app.use(`${baseApi}/${prefix}`, router);
});

app.use(errorMiddleware);

export default app; 