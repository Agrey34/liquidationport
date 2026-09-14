import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Customer / Wholesale Buyer Registration DTO
 */
export class CustomerRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  buyerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;
}

// Backward compatibility alias
export class RegisterDto extends CustomerRegisterDto {}

/**
 * Admin Registration DTO
 * Requires structural protection / authorization passcode to prevent unauthorized privilege escalation.
 */
export class AdminRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid administrative email address.' })
  @IsNotEmpty({ message: 'Administrative email is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Admin password must be at least 8 characters long.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin authorization passcode is required for structural protection.' })
  passcode: string;
}

export class CheckAccountDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
