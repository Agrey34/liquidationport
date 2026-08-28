import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, IsUrl, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  PORT?: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  SUPABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_ANON_KEY: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_ROLE_KEY: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_DATABASE_URL: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;
  
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  // Cloudflare R2 Storage
  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_DOMAIN?: string;

  // Supabase S3 Storage
  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_REGION?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
