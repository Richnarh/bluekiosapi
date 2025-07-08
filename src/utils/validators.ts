import { IsEmail, IsNotEmpty, Length, Matches, MinLength, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import prisma from '@/config/prisma';

export class UserValidator {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  emailAddress: string | undefined;

  @IsNotEmpty({ message: 'Name is required' })
  fullName?: string;

  @IsNotEmpty({ message: 'Name is required' })
  @Matches(/^(?:(?:\+233)|0)(?:[2357]\d{8}|[23][2-9]\d{7})$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '1. Password must contain at least one uppercase letter, 2. Password must contain at least one lowercase letter,  3. Password must contain at least one number, 4. Password must contain at least one special character',
  })
  password?: string;
}

export class VerifyOtpValidator {
  @IsNotEmpty({ message: 'User ID is required' })
  userId?: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP code must be 6 digits' })
  code?: string;
}

export class LoginUserValidator {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  emailAddress?: string;

  @IsNotEmpty({ message: 'Password is required' })
  password?: string;
}

export class RefreshTokenValidator {
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken?: string;
}

export class CustomerValidator{
  @IsNotEmpty({ message: 'Name is required' })
  fullName?: string;

  @IsNotEmpty({ message: 'Phone Number is required' })
  phoneNumber?: string;
}

  @ValidatorConstraint({ async: true })
  export class UserAlreadyExistConstraint implements ValidatorConstraintInterface {
    async validate(email: string, args: ValidationArguments) {
      const user = await prisma.user.findUnique({
        where: {
          emailAddress: email
        }
      });
      if (user) return false; 
      return true;
    }
  }

  export function userAlreadyExist(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: UserAlreadyExistConstraint,
      });
    };
  }
