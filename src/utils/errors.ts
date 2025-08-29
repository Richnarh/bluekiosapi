export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: any, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}