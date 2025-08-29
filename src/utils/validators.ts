import { IsNotEmpty, Length, Matches, MinLength, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User.js';

@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  private static userRepository:Repository<User>;

  public static initialize(dataSource: DataSource) {
      this.userRepository = dataSource.getRepository(User);
    }

  async validate(value: string, args: ValidationArguments): Promise<boolean> {
        if (!value) return true;
        if (!IsUniqueConstraint.userRepository) {
            throw new Error('UserRepository not initialized for IsUniqueConstraint');
        }
        const [field] = args.constraints as [string];
        const user = await IsUniqueConstraint.userRepository.findOneBy({ [field]: value });
        return !user;
    }

    defaultMessage(args: ValidationArguments): string {
        const [, displayName] = args.constraints as [string, string];
        return `${displayName} ${args.value} already exists`;
    }
}

 const createUniqueDecorator = (field: string, displayName: string) => {
  return function (validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName,
        options: validationOptions,
        constraints: [field, displayName],
        validator: IsUniqueConstraint,
      });
    };
  };
}

export const IsEmailUnique = createUniqueDecorator('emailAddress', 'Email');
export const IsUsernameUnique = createUniqueDecorator('username', 'Username');
export const IsPhoneUnique = createUniqueDecorator('phoneNumber', 'Phone number');

export class UserValidator {
  @IsEmailUnique()
  emailAddress: string | undefined;

  @IsNotEmpty({ message: 'Name is required' })
  fullName: string | undefined;

  @IsNotEmpty({ message: 'Username is required' })
  @IsUsernameUnique()
  username: string | undefined;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneUnique()
  @Matches(/^(?:(?:\+233)|0)(?:[2357]\d{8}|[23][2-9]\d{7})$/, { message: 'Invalid phone number format' })
  phoneNumber: string | undefined;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '1. Password must contain at least one uppercase letter 2. Password must contain at least one lowercase letter 3. Password must contain at least one number 4. Password must contain at least one special character',
  })
  password: string | undefined;
}

export class VerifyOtpValidator {
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string | undefined;

  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP code must be 6 digits' })
  code: string | undefined;
}

export class LoginUserValidator {
  @IsNotEmpty({ message: 'Username is required' })
  username: string | undefined;

  @IsNotEmpty({ message: 'Password is required' })
  password: string | undefined;
}

export class RefreshTokenValidator {
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string | undefined;
}

export class CustomerValidator{
  @IsNotEmpty({ message: 'Name is required' })
  fullName: string | undefined;

  @IsNotEmpty({ message: 'Phone Number is required' })
  phoneNumber: string | undefined;

  @IsNotEmpty({ message: 'UserId is required' })
  userId: string | undefined;
}

export class MeasurementValidator{
  @IsNotEmpty({ message: 'Name is required'})
  name: string | undefined;
  
  @IsNotEmpty({ message: 'UserId is required'})
  userId: string | undefined;
}

export class CustomerDetailsValidator {
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId: string | undefined;

  @IsNotEmpty({ message: 'User ID is required' })
  userId: string | undefined;
}

export class Js {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private static readonly PHONE_REGEX = /^(?:(?:\+233)|0)(?:[2357]\d{8}|[23][2-9]\d{7})$/;
  private static readonly MAX_EMAIL_LENGTH = 254;

  static isValidPhone = (phoneNumber: string): { isValid: boolean; message?: string } => {
    const phone = phoneNumber.trim();
    if (!Js.PHONE_REGEX.test(phone)) {
      return { isValid: false, message: 'Invalid phone number format' };
    }
    return { isValid: true };
  }

  static isValidEmail = (email: string): { isValid: boolean; message?: string } => {
    const emailAddress = email.trim();
    if (emailAddress.length > Js.MAX_EMAIL_LENGTH) {
      return { isValid: false, message: 'Email length exceeds maximum limit' };
    }
    if (!Js.EMAIL_REGEX.test(emailAddress)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    return { isValid: true };
  }
}