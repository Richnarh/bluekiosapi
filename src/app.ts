import express, { Application, NextFunction, Request, Response } from 'express';
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

// app.use(`${baseApi}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/uploads/:company', async (req: Request, res: Response, next: NextFunction) => {
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

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const pascalToKebab = (str: string) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') 
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

Object.entries(routes).forEach(([prefix, router]) => {
  console.log(`${baseApi}/${pascalToKebab(prefix)}`)
  app.use(`${baseApi}/${pascalToKebab(prefix)}`, router);
});

app.use(errorMiddleware);

export default app; 