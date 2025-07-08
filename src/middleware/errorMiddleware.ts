import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { HttpStatus } from '../utils/constants';
import { logger } from '@/utils/logger';

export const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    logger.error('Operational error', {
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
    });
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  // logger.error('Unexpected error:', error);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: 'Internal server error',
  });
};