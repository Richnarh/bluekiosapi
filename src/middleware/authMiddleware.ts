import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { HttpStatus } from '../utils/constants';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: { id: string; emailAddress: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.warn('No token provided in request', { path: req.path });
    throw new AppError('No token provided', HttpStatus.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; emailAddress: string };
    req.user = decoded;
    logger.debug('Token verified successfully', { userId: decoded.id });
    next();
  } catch (error) {
    logger.error('Invalid token', { error, path: req.path });
    throw new AppError('Invalid token', HttpStatus.UNAUTHORIZED);
  }
}