import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { isEmpty } from 'class-validator';
import { DefaultService } from './DefaultService.js';
import { User } from '../entities/User.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { Otp } from '../entities/Otp.js';
import { EmailService } from './emailService.js';
import { SmsService } from './smsService.js';
import { CompanyService } from './companyService.js';
import { omit } from 'lodash-es';

export class AuthService{
  private userRepository: Repository<User>;
  private otpRepository:Repository<Otp>;
  private tokenRepository:Repository<RefreshToken>;
  private companyService:CompanyService;
  private ds:DefaultService;
  private emailService:EmailService;
  private SALT_ROUNDS = 10;
  
  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
    this.otpRepository = dataSource.getRepository(Otp);
    this.tokenRepository = dataSource.getRepository(RefreshToken);
    this.companyService = new CompanyService(dataSource);
    this.emailService = new EmailService();
    this.ds = new DefaultService(dataSource);
  }
  
    async save(user:User, company:string){
        const hashPassword = await bcrypt.hash(user.password, this.SALT_ROUNDS);
        user.password = hashPassword;
        user.addedBy = user.fullName;
        user.updatedAt = new Date();
        const usr = this.userRepository.create(user);
        const newUser = await this.userRepository.save(usr);
        if(!newUser){
            throw new AppError('Could not create user', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const newCompany = await this.companyService.createCompany(newUser, company);
        await this.companyService.createPath(company);
        await this.generateOtp(newUser);
        const userWithoutPassword = omit(user, ['password']);
        userWithoutPassword.id = newUser.id;

        const accessToken = this.createAccessToken(newUser);
        const refreshToken = await this.createRefreshToken(newUser.id);

        return { accessToken, refreshToken, user: {...userWithoutPassword, company: newCompany} };
    }
    
    async loginUser(loginReq:{username: string, password: string}) {
      const  { username, password } = loginReq;
      if(!username){
       throw new AppError('Username is required', HttpStatus.BAD_REQUEST);
      }
      if(!password){
       throw new AppError('Password is required', HttpStatus.BAD_REQUEST);
      }
      const user = await this.userRepository.findOne({ 
        where: { username }
      });
      if (!user) {
        throw new AppError('Invalid credentials', HttpStatus.BAD_REQUEST);
      }
      if (!user.isVerified) {
        throw new AppError('Please verify your account before logging in', HttpStatus.BAD_REQUEST);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid username or password', HttpStatus.BAD_REQUEST);
      }
      const accessToken = this.createAccessToken(user);
      const refreshToken = await this.createRefreshToken(user.id);
      logger.info('User logged in successfully', { userId: user.id });
      return { user, accessToken, refreshToken };
    }
    
    public createAccessToken(user:User){
      if (!process.env.JWT_SECRET) {
        throw new AppError('Server configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      let accessToken:string | null;
      if(!isEmpty(user.emailAddress)){
        accessToken = jwt.sign({ id: user.id, emailAddress: user.emailAddress }, process.env.JWT_SECRET, { expiresIn: '5h' });
      }else{
        accessToken = jwt.sign({ id: user.id, phoneNumber: user.phoneNumber }, process.env.JWT_SECRET, { expiresIn: '5h' });
      }
      return accessToken;
    }
  
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
      const tokens = await this.verifyRefreshToken(refreshToken);
      const user = await this.userRepository.findOneBy({ id: tokens.user?.id });
      if (!user) {
        throw new AppError('Invalid refresh token', HttpStatus.BAD_REQUEST);
      }
      await this.tokenRepository.remove(tokens);
      const accessToken = jwt.sign({ id: user.id, emailAddress: user.emailAddress }, process.env.JWT_SECRET!, { expiresIn: '5h'});
      const token = await this.createRefreshToken(user.id!);
      logger.info('Access token refreshed successfully', { userId: user.id });
      return { accessToken, refreshToken: token! };
  }

  async createRefreshToken(id: string){
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const user = await this.userRepository.findOneBy({ id });
      if(!user){
        throw new AppError('UserId is required', HttpStatus.BAD_REQUEST);
      }
      const refreshToken = new RefreshToken();
      refreshToken.user = user!;
      refreshToken.token = hashedToken;
      refreshToken.expiresAt = expiresAt;
      refreshToken.addedBy = user?.emailAddress;
      await this.tokenRepository.delete({ user: { id }});
      await this.tokenRepository.save(refreshToken);
      logger.info('Refresh token created successfully', { tokenId: refreshToken.id });
      return token;
    } catch (error) {
      console.log(error)
      throw new AppError(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshToken> {
    const tokenRecord = await this.tokenRepository
    .createQueryBuilder('refreshToken')
    .where('refreshToken.expiresAt >= :currentDate', { currentDate: new Date() })
    .getOne();
    
    if (!tokenRecord) {
      throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }
    const isMatch = await bcrypt.compare(token, tokenRecord.token!);
    if (!isMatch) {
      throw new AppError('Invalid refresh token', HttpStatus.BAD_REQUEST);
    }
    logger.info('Refresh token verified successfully', { userId: tokenRecord.user });
    return tokenRecord;
  }

  async findRefreshToken(token: string, user: User): Promise<RefreshToken | null> {
    const tokenRecord = await this.tokenRepository
      .createQueryBuilder('refreshToken')
      .where('refreshToken.user = :userId', { userId: user.id })
      .andWhere('refreshToken.expiresAt >= :currentDate', { currentDate: new Date() })
      .getOne();

    if (!tokenRecord) return null;
    
    const isMatch = await bcrypt.compare(token, tokenRecord.token!);
    return isMatch ? tokenRecord : null;
  }

  deleteRefreshToken = async (id: string) => {
    await this.tokenRepository.delete(id);
    logger.info('Refresh token deleted successfully', { id });
  }

  logoutUser = async (refreshToken: string, userId:string) => {
    const user = await this.userRepository.findOneBy({ id: userId });
    if(!user){
      throw new AppError('User not found', HttpStatus.BAD_REQUEST);
    }
    const tokenRecord = await this.findRefreshToken(refreshToken,user);
    if (tokenRecord) {
        await this.tokenRepository.delete({ user: { id: userId } });
        logger.info('User logged out successfully', { userId: tokenRecord.user });
    } else {
        throw new AppError('Refresh token not found for logout', HttpStatus.NOT_FOUND);
    }
  }

  verifyPassword = async(id: string, password: string): Promise<boolean> => {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new AppError('User not found for password verification', HttpStatus.NOT_FOUND);
      }
      return await bcrypt.compare(password, user.password);
    }

async verifyUser(id: string){
    try {
      const updateResult = await this.userRepository.update(id, { isVerified: true });

      if (updateResult.affected === 0) {
        logger.warn('User not found for verification', { id });
        return null;
      }
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        logger.warn('User not found after update', { id });
        return null;
      }
      const { password, createdAt, updatedAt, ...verifiedUser } = user;
      return verifiedUser;
    } catch (error) {
      logger.error(error);
      throw new AppError(`Failed to verify user with ID ${id}: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createOtp(userId: string, code: string): Promise<Otp> {
    const existingOtp = await this.otpRepository.findOneBy({ user: { id: userId } });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    let newOtp:Otp;
    if(existingOtp){
      existingOtp.code = code;
      existingOtp.expiresAt = expiresAt
      newOtp = await this.otpRepository.save(existingOtp);
    }else{
      const user = await this.ds.getUserById(userId);
      const company = await this.ds.getCompanyByUser(userId);
      const otp = new Otp();
      otp.code = code;
      otp.expiresAt = expiresAt
      otp.user = user!;
      otp.addedBy = user?.fullName +' '+company?.companyName || null!
      newOtp = await this.otpRepository.save(otp);
    }
    return newOtp;
  }

  public verifyOttp = async (userId:string, code: string) => {
    const otp = await this.otpRepository.findOne({
      where: {
        user: { id: userId },
        code: code,
        expiresAt: MoreThanOrEqual(new Date()),
      }
    });

    if (!otp){
        throw new AppError('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }
    return otp;
  }

  public generateOtp = async(user:User) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.createOtp(user.id, otpCode);
    if(user.emailAddress){
        await this.emailService.sendOtpEmail(user.emailAddress, otpCode);
    }
    if(user.phoneNumber){
      await SmsService.sendOtpSms(user.phoneNumber, otpCode);
    }
  }
  
  async deleteOtp(code: string): Promise<void> {
    await this.otpRepository.delete({ code });
    logger.info('OTP deleted successfully', { code });
  }
}