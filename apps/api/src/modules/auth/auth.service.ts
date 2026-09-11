import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) {
      this.supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
    }
  }

  /**
   * Fast unique account pre-flight check using PostgreSQL B-Tree indexes.
   * Checks if either email OR standardized E.164 phone already exists.
   */
  async checkAccountAvailability(email?: string, phone?: string): Promise<{ available: boolean }> {
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    // Standardize E.164 phone: strip any internal whitespace, ensure leading plus
    let sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : null;
    if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
      sanitizedPhone = `+${sanitizedPhone}`;
    }

    if (!normalizedEmail && !sanitizedPhone) {
      return { available: true };
    }

    const orConditions: any[] = [];
    if (normalizedEmail) {
      orConditions.push({ email: normalizedEmail });
    }
    if (sanitizedPhone) {
      orConditions.push({ phone: sanitizedPhone });
    }

    // High-performance index scan using users_email_key and users_phone_key
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: orConditions,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (existing) {
      const isEmailConflict = normalizedEmail && existing.email.toLowerCase() === normalizedEmail;
      const conflictField = isEmailConflict ? 'email' : 'phone';

      this.logger.warn(
        `[Registration Conflict] Duplicate account rejected for ${conflictField}: ${
          isEmailConflict ? normalizedEmail : sanitizedPhone
        }`
      );

      throw new HttpException(
        {
          status: 'error',
          field: 'email_or_phone',
          conflictField,
          message: 'This email or phone number is already associated with an account.',
        },
        HttpStatus.CONFLICT, // 409 Conflict
      );
    }

    return { available: true };
  }

  /**
   * Secure registration endpoint with database constraint pre-flight check.
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone, buyerType, companyName } = registerDto;

    // 1. Mandatory Pre-Flight Database Check (Before any hashing or auth creation)
    await this.checkAccountAvailability(email, phone);

    const normalizedEmail = email.trim().toLowerCase();
    let sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : undefined;
    if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
      sanitizedPhone = `+${sanitizedPhone}`;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    // 2. Create user via Supabase Auth
    if (!this.supabaseAdmin) {
      throw new HttpException(
        'Authentication service is unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // auto-confirm so user can immediately sign in or use session
      user_metadata: {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        full_name: fullName,
        phone: sanitizedPhone,
        buyer_type: buyerType || 'Retail Buyer',
        company_name: companyName || null,
        role: 'customer',
      },
    });

    if (authError) {
      this.logger.error(`Supabase Auth creation failed: ${authError.message}`);
      if (
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already associated') ||
        authError.message.toLowerCase().includes('unique')
      ) {
        throw new HttpException(
          {
            status: 'error',
            field: 'email_or_phone',
            message: 'This email or phone number is already associated with an account.',
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(authError.message, HttpStatus.BAD_REQUEST);
    }

    const userId = authData.user.id;

    // 3. Ensure user is recorded in public.users (in case DB trigger is bypassed)
    const user = await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: normalizedEmail,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: sanitizedPhone || null,
        buyerType: buyerType || 'Retail Buyer',
        companyName: companyName || null,
        role: 'customer',
      },
      update: {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: sanitizedPhone || null,
        buyerType: buyerType || 'Retail Buyer',
        companyName: companyName || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        buyerType: true,
        createdAt: true,
      },
    });

    this.logger.log(`New wholesale account registered: ${user.id} (${user.email})`);

    return {
      status: 'success',
      message: 'Account registered successfully.',
      user,
    };
  }
}
