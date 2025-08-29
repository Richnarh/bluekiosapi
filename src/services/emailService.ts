import nodemailer from 'nodemailer';
import { HttpStatus } from '../utils/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service:'gmail',
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls:{
        ciphers:'SSLv3'
      }
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your OTP for Account Verification',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        html: `<p>Your OTP code is <b>${otp}</b>. It is valid for 10 minutes.</p>`,
      });
      logger.info('OTP email sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send OTP email', { error, to });
      throw new AppError('Failed to send OTP email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}