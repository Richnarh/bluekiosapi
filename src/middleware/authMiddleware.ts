import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';

export interface AuthRequest extends Request {
  user?: { userId: string; emailAddress: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Access token is missing' });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'JWT_SECRET is not defined' });
      return;
    }
    const decoded = jwt.verify(token,  process.env.JWT_SECRET) as { userId: string, emailAddress:string };
    req.user = decoded
    next();
  } catch (error:any) {
    if (error.name === 'TokenExpiredError') {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Access token has expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(HttpStatus.FORBIDDEN).json({ message: 'Invalid access token' });
      return;
    }
    next(new AppError(error, HttpStatus.INTERNAL_SERVER_ERROR));
  }
}