import { NextFunction, Request, Response} from 'express';
import { DataSource, Repository } from 'typeorm';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AuthService } from '../services/authService.js';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { LoginRequest } from '../models/model.js'
import { DefaultService } from '../services/DefaultService.js';
import { isEmpty } from 'class-validator';
import { logger } from '../utils/logger.js';
import { User } from '../entities/User.js';

export class AuthController{
    private readonly userRepository: Repository<User>;
    private readonly authService:AuthService;
    private readonly ds:DefaultService;

        constructor(dataSource: DataSource) {
            this.authService = new AuthService(dataSource);
            this.userRepository = dataSource.getRepository(User);
            this.ds = new DefaultService(dataSource);
        }

    async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const request  = req.body as LoginRequest;
            const loginReq = { username: request.username, password: request.password };
            const { user, accessToken, refreshToken } = await this.authService.loginUser(loginReq);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            const company = await this.ds.getCompanyByUser(user.id);
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
        const { accessToken, refreshToken } = await this.authService.refreshAccessToken(token);
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
            await this.authService.logoutUser(refreshToken,userId);
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
            await this.authService.verifyOttp(userId, code);
            const user = await this.authService.verifyUser(userId);
            if (!user) {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
            await this.authService.deleteOtp(code);
            res.status(HttpStatus.OK).json({ message: 'Account verified successfully', isVerified: user.isVerified });
        } catch (error) {
            next(error);
        }
    }

    requestOtp = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { emailPhone } = req.body;
            const users = await this.userRepository.find({
                where: [
                    { emailAddress: emailPhone },
                    { phoneNumber: emailPhone },
                ],
            });

            if (!users || users.length === 0) {
                throw new AppError(`The entered: ${emailPhone} does not exist.`, HttpStatus.BAD_REQUEST);
            }

            const user = users[0];
            await this.authService.generateOtp(user);
            res.status(HttpStatus.OK).json({
                message: `OTP has been sent to: ${emailPhone}, OTP expires after 10 minutes`,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

}