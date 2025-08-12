import { IsEmail, IsNotEmpty, Length, Matches, MinLength, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import prisma from '@/config/prisma';

@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: string, args: ValidationArguments) {
    const [prismaField] = args.constraints as [string, string];
    const user = await prisma.user.findFirst({
      where: { [prismaField]: value },
    });
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    const [, displayName] = args.constraints as [string, string];
    return `${displayName} ${args.value} already exists`;
  }
}

 const createUniqueDecorator = (prismaField: string, displayName: string) => {
  return function (validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName,
        options: validationOptions,
        constraints: [prismaField, displayName],
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