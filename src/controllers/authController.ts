import { NextFunction, Request, Response} from 'express';
import { AuthRequest } from '@/middleware/authMiddleware';
import { AuthService } from '@/services/authService';
import { HttpStatus } from '@/utils/constants';
import { AppError } from '@/utils/errors';
import { LoginRequest } from '@/models/model'
import prisma from '@/config/prisma';
import { UserService } from '@/services/userService';
import { DefaultService as ds } from '@/services/DefaultService';
import { isEmpty } from 'class-validator';
import { logger } from '@/utils/logger';

export class AuthController{
  private auth:AuthService;
  private userService:UserService;

  constructor(){
    this.auth = new AuthService();
    this.userService = new UserService();
  }

    async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const request  = req.body as LoginRequest;
            const loginReq = { username: request.username, password: request.password }
            const { user, accessToken, refreshToken } = await this.auth.loginUser(loginReq);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            const company = await ds.getCompany(user.id);
            const { password, ...restUser } = user;
            const response = {  ...restUser, company };
            res.status(HttpStatus.OK).json({
                message: 'Login successful',
                data: {accessToken,refreshToken, user:response } }
            );
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
        const token = req.cookies.refreshToken;
        if(!token){
            throw new AppError('No refresh token provided', HttpStatus.UNAUTHORIZED);
        }
        const { accessToken, refreshToken } = await this.auth.refreshAccessToken(token);
        res.status(HttpStatus.OK).json({ message: 'Token refreshed successfully', accessToken, refreshToken});
        } catch (error) {
            logger.error(error);
            next(error);
        }
    }

    async logoutUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const refreshToken = req.cookies.refreshToken;
            const { userId } = req.params;
            if (isEmpty(refreshToken)) {
                throw new AppError(`Refresh token is required`, HttpStatus.BAD_REQUEST);
            }
            if (isEmpty(userId) || userId === 'undefined') {
                throw new AppError(`UserId is required`, HttpStatus.BAD_REQUEST);
            }
            await this.auth.logoutUser(refreshToken,userId);
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            res.status(HttpStatus.OK).json({ message: 'Logout successful' });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, code } = req.body;
            await this.auth.verifyOtp({userId, code});
            const user = await this.auth.verifyUser(userId);
            if (!user) {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
            await this.auth.deleteOtp(code);
            const company = ds.getCompany(user.id);
            const response = { ...user, company };
            res.status(HttpStatus.OK).json({ message: 'Account verified successfully', data: response });
        } catch (error) {
            next(error);
        }
    }

    async requestOtp(req:Request, res:Response, next:NextFunction){
        try {
            const { emailPhone } = req.body;
            const users = await prisma.user.findMany({ 
                where: {
                OR: [
                    { emailAddress: emailPhone },
                    { phoneNumber: emailPhone }
                ]
                }
            });
            if (!users || users.length === 0) {
                throw new AppError(`The entered: ${emailPhone} does not exist.`, HttpStatus.BAD_REQUEST);
            }
            const user = users[0];
            this.userService.generateOtp(user);
            res.status(HttpStatus.OK).json({message: `OTP has been sent to: ${emailPhone}, OTP expires after 10 munites`});
        } catch (error) {
            console.log(error)
            next(error);
        }
    }

}