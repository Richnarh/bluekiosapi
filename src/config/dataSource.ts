import { logger } from '../utils/logger.js';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    const isProduction = env === 'production';

    const AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [path.join(__dirname, '..', 'entities', `*.${isProduction ? 'js' : 'ts'}`)],
      synchronize: isProduction ? false : true,
      logging: isProduction ? ['error'] : false,
      extra: {
        max: isProduction ? 50 : 10,
        min: isProduction ? 5 : 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    });

    await AppDataSource.initialize();
    logger.info(`Database connected in ${env} mode with connection pool`);
    return AppDataSource;
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};