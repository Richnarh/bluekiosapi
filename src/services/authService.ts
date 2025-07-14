import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ulid } from 'ulid';
import jwt from 'jsonwebtoken';
import prisma from '@/config/prisma';
import { Otp, RefreshToken, User } from '../../generated/prisma';
import { HttpStatus } from '@/utils/constants';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { CrudService } from './crudservice';
import { plainToInstance } from 'class-transformer';
import { isEmpty, validate } from 'class-validator';
import { LoginUserValidator, RefreshTokenValidator, VerifyOtpValidator } from '@/utils/validators';

export class AuthService{
  private SALT_ROUNDS = 10;
  private otpService:CrudService<Otp>;
  private tokenService:CrudService<RefreshToken>;
  private userService:CrudService<User>;

  constructor(){
    this.otpService = new CrudService<Otp>(prisma.otp);
    this.tokenService = new CrudService<RefreshToken>(prisma.refreshToken);
    this.userService = new CrudService<User>(prisma.user);
  }
    async loginUser(loginReq:{emailPhone: string, password: string}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        const loginDto = plainToInstance(LoginUserValidator, loginReq);
        const errors = await validate(loginDto);

        if (errors.length > 0) {
        const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn('Validation failed for loginUser', { errors: errorMessages });
            throw new AppError(`Validation failed: ${errorMessages}`, HttpStatus.BAD_REQUEST);
        }

        const  { emailPhone, password } = loginReq;
        
      const users = await prisma.user.findMany({ 
        where: {
          OR: [
            { emailAddress: emailPhone },
            { phoneNumber: emailPhone }
          ]
        }
      });
      if (!users || users.length === 0) {
        throw new AppError('Invalid credentials', HttpStatus.BAD_REQUEST);
      }
      const user = users[0];
      if (!user.isVerified) {
        throw new AppError('Please verify your email before logging in', HttpStatus.BAD_REQUEST);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', HttpStatus.BAD_REQUEST);
      }
      if (!process.env.JWT_SECRET) {
        throw new AppError('Server configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      let accessToken:string | null;
      if(!isEmpty(user.emailAddress)){
        accessToken = jwt.sign({ id: user.id, emailAddress: user.emailAddress }, process.env.JWT_SECRET, { expiresIn: '3h' });
      }else{
        accessToken = jwt.sign({ id: user.id, phoneNumber: user.phoneNumber }, process.env.JWT_SECRET, { expiresIn: '3h' });
      }
      const refreshToken = await this.createRefreshToken(user.id);
      logger.info('User logged in successfully', { userId: user.id });
      return { user, accessToken, refreshToken };
    }
  
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const refreshDto = plainToInstance(RefreshTokenValidator, refreshToken);
        const errors = await validate(refreshDto);
        
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn('No refresh token provided', { errors: errorMessages });
            throw new AppError(`No refresh token provided: ${errorMessages}`, HttpStatus.UNAUTHORIZED);
        }
      const tokenRecord = await this.verifyRefreshToken(refreshToken);
      const user = await this.userService.findUnique(tokenRecord.userId);
      if (!user) {
        logger.warn('User not found for refresh token', { userId: tokenRecord.userId });
        throw new AppError('Invalid refresh token', HttpStatus.BAD_REQUEST);
      }
      await this.deleteRefreshToken(tokenRecord.id);
      const accessToken = jwt.sign({ id: user.id, emailAddress: user.emailAddress }, process.env.JWT_SECRET!, { expiresIn: '1h'});
      const newRefreshToken = await this.createRefreshToken(user.id);
      logger.info('Access token refreshed successfully', { userId: user.id });
      return { accessToken, refreshToken: newRefreshToken };
  }

  async createRefreshToken(userId: string): Promise<string> {
    logger.debug('Creating refresh token for user', { userId });
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshToken = await this.tokenService.create({
      id: ulid(),
      refreshToken: hashedToken,
      userId,
      expiresAt,
      createdAt: new Date(),
    });
    logger.info('Refresh token created successfully', { userId, tokenId: refreshToken.id });
    return token;
  }

  async verifyRefreshToken(token: string): Promise<RefreshToken> {
    logger.debug('Verifying refresh token');
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        expiresAt: { gte: new Date() },
      },
    });
    if (!tokenRecord) {
      logger.warn('Invalid or expired refresh token');
      throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }
    const isMatch = await bcrypt.compare(token, tokenRecord.refreshToken);
    if (!isMatch) {
      logger.warn('Invalid refresh token');
      throw new AppError('Invalid refresh token', HttpStatus.BAD_REQUEST);
    }
    logger.info('Refresh token verified successfully', { userId: tokenRecord.userId });
    return tokenRecord;
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    logger.debug('Finding refresh token');
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        expiresAt: { gte: new Date() },
      },
    });
    if (!tokenRecord) {
      return null;
    }
    const isMatch = await bcrypt.compare(token, tokenRecord.refreshToken);
    return isMatch ? tokenRecord : null;
  }

  async deleteRefreshToken(id: string): Promise<void> {
    logger.debug('Deleting refresh token', { id });
    await this.tokenService.delete(id);
    logger.info('Refresh token deleted successfully', { id });
  }

  async logoutUser(refreshToken: string): Promise<void> {
        const refreshDto = plainToInstance(RefreshTokenValidator, refreshToken);
        const errors = await validate(refreshDto);
      
        if (errors.length > 0) {
            const errorMessages = errors
            .map(err => Object.values(err.constraints || {}).join(', '))
            .join('; ');
            logger.warn('Validation failed for logoutUser', { errors: errorMessages });
            throw new AppError(`Validation failed: ${errorMessages}`, HttpStatus.BAD_REQUEST);
        }
        const tokenRecord = await this.findRefreshToken(refreshToken);
        if (tokenRecord) {
            await this.deleteRefreshToken(tokenRecord.id);
            logger.info('User logged out successfully', { userId: tokenRecord.userId });
        } else {
            logger.warn('Refresh token not found for logout');
        }
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
      logger.debug('Verifying password for user', { id });
      const user = await this.userService.findUnique(id);
      if (!user) {
        logger.warn('User not found for password verification', { id });
        return false;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      logger.info('Password verification completed', { id, isMatch });
      return isMatch;
    }

  async verifyUser(id: string): Promise<Omit<User, 'password' | 'createdAt' | 'updatedAt'> | null> {
      logger.debug('Verifying user', { id });
      const u = await this.userService.update(id, { isVerified: true });
      let user = null;
      if (u) {
          const { password, ...newUser } = u;
          user = newUser;
          logger.info('User verified successfully', { id });
        } else {
            logger.warn('User not found for verification', { id });
        }
      return user;
  }

  async createOtp(userId: string, code: string): Promise<Otp> {
    logger.debug('Creating OTP for user', { userId });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otp = await this.otpService.create({
      id: ulid(),
      code,
      userId,
      expiresAt,
      createdAt: new Date(),
    });
    logger.info('OTP created successfully', { userId, otpId: otp.id });
    return otp;
  }

  async verifyOtp(verifyDto:{userId: string, code: string}): Promise<Otp | null> {
    const result = plainToInstance(VerifyOtpValidator, verifyDto);
    const errors = await validate(result);
    
    if (errors.length > 0) {
        const errorMessages = errors
        .map(err => Object.values(err.constraints || {}).join(', '))
        .join('; ');
        logger.warn('Validation failed for verifyOtp', { errors: errorMessages });
        throw new AppError(`${errorMessages}`, HttpStatus.BAD_REQUEST);
    }
    const { userId, code } = verifyDto;
    
    const otp = await prisma.otp.findFirst({
    where: {
        userId,
        code,
        expiresAt: { gte: new Date() },
    },
    });
    if (otp) {
        logger.info('OTP verified successfully', { userId, otpId: otp.id });
    } else {
        logger.warn('Invalid or expired OTP', { userId });
        throw new AppError('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }
    return otp;
  }

  async deleteOtp(code: string): Promise<void> {
    logger.debug('Deleting OTP', { code });
    await prisma.otp.delete({ where: { code } });
    logger.info('OTP deleted successfully', { code });
  }
}