import { IsEmail, IsNotEmpty, Length, Matches, MinLength, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import prisma from '@/config/prisma';

  @ValidatorConstraint({ async: true })
  export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    async validate(email: string, args: ValidationArguments) {
      const user = await prisma.user.findUnique({
        where: {
          emailAddress: email
        }
      });
      return !user;
    }
    defaultMessage(args: ValidationArguments) {
      return `Email ${args.value} already exists`;
    }
  }

  export function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsEmailUniqueConstraint,
      });
    };
  }

   @ValidatorConstraint({ async: true })
   export class IsPhoneUniqueConstraint implements ValidatorConstraintInterface {
     async validate(phoneNumber: string, args: ValidationArguments) {
       const user = await prisma.user.findUnique({
         where: { phoneNumber },
       });
       return !user;
     }

     defaultMessage(args: ValidationArguments) {
       return `Phone number ${args.value} already exists`;
     }
   }

   export function IsPhoneUnique(validationOptions?: ValidationOptions) {
     return function (object: Object, propertyName: string) {
       registerDecorator({
         target: object.constructor,
         propertyName: propertyName,
         options: validationOptions,
         constraints: [],
         validator: IsPhoneUniqueConstraint,
       });
     };
   }

export class UserValidator {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsEmailUnique()
  emailAddress: string | undefined;

  @IsNotEmpty({ message: 'Name is required' })
  fullName?: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneUnique()
  @Matches(/^(?:(?:\+233)|0)(?:[2357]\d{8}|[23][2-9]\d{7})$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '1. Password must contain at least one uppercase letter 2. Password must contain at least one lowercase letter 3. Password must contain at least one number 4. Password must contain at least one special character',
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
  @IsNotEmpty({ message: 'Email/Phone is required' })
  emailPhone?: string;

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

export class MeasurementValidator{
  @IsNotEmpty({ message: 'Name is required'})
  name?: string;
  
  @IsNotEmpty({ message: 'UserId is required'})
  userId?: string;
}