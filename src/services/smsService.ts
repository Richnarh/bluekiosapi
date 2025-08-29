import { logger } from '../utils/logger.js';
import axios from "axios";

export class SmsService{
    static sendOtpSms = async(phoneNumber:string, otpCode:string) => {
        try {
            const url = process.env.SMS_URL || 'https://api.smsonlinegh.com/v5/message/sms/send';
            const host = process.env.SMS_HOST;
            const key = process.env.SMS_KEY;
            const sernderId = process.env.SMS_ID;

            const payload = {
                text: `Your OTP code is ${otpCode}. It is valid for 10 minutes.`,
                type:0,
                sender: sernderId,
                destinations:[phoneNumber]
            }

            await axios.post(url, payload, {
                headers: {
                    'Host': host,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json; charset=utf-8',
                    'Authorization': `key ${key}`
                }
            });
            logger.info('OTP sms sent successfully', { phoneNumber });
        } catch (error) {
            logger.error('err: ',error);
        }
    }
}