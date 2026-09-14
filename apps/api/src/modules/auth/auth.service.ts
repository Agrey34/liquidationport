import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CustomerRegisterDto, AdminRegisterDto, RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';

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
    let sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : null;
    if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
      sanitizedPhone = `+${sanitizedPhone}`;
    }

    if (!normalizedEmail && !sanitizedPhone) {
      return { available: true };
    }

    const orConditions: Prisma.UserWhereInput[] = [];
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
   * Customer / Wholesale Buyer Registration
   * Explicitly assigns and persists the "BUYER" role in both Supabase Auth claims and PostgreSQL.
   */
  async registerCustomer(dto: CustomerRegisterDto) {
    const { email, password, firstName, lastName, phone, buyerType, companyName } = dto;

    // 1. Mandatory Pre-Flight Database Check
    await this.checkAccountAvailability(email, phone);

    const normalizedEmail = email.trim().toLowerCase();
    let sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : undefined;
    if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
      sanitizedPhone = `+${sanitizedPhone}`;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const assignedBuyerType = buyerType || 'Retail Buyer';

    if (!this.supabaseAdmin) {
      throw new HttpException(
        'Authentication service is unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 2. Create user via Supabase Auth with explicit BUYER role claims
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // auto-confirm for immediate wholesale access
      app_metadata: {
        role: 'buyer',
      },
      user_metadata: {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        full_name: fullName,
        phone: sanitizedPhone,
        buyer_type: assignedBuyerType,
        company_name: companyName || null,
        role: 'buyer',
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

    // 3. Persist in public.users with explicit BUYER role
    const user = await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: normalizedEmail,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: sanitizedPhone || null,
        buyerType: assignedBuyerType,
        companyName: companyName || null,
        role: 'buyer',
      },
      update: {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: sanitizedPhone || null,
        buyerType: assignedBuyerType,
        companyName: companyName || null,
        role: 'buyer',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        buyerType: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`New wholesale BUYER registered: ${user.id} (${user.email}) [role: buyer]`);

    return {
      status: 'success',
      message: 'Buyer account registered successfully.',
      user,
    };
  }

  /**
   * Backward-compatibility alias for customer registration
   */
  async register(registerDto: RegisterDto) {
    return this.registerCustomer(registerDto);
  }

  /**
   * Administrator Registration
   * Structural Protection: Requires a valid administrative authorization passcode.
   * Prevents unauthorized escalation to the "ADMIN" role.
   */
  async registerAdmin(dto: AdminRegisterDto) {
    const { email, password, firstName, lastName, phone, passcode } = dto;

    // 1. Structural Protection: Enforce authorization passcode
    const expectedPasscode =
      this.configService.get<string>('ADMIN_REGISTRATION_PASSCODE') ||
      this.configService.get<string>('ADMIN_INVITE_CODE') ||
      'LP_ADMIN_2026_PORT';

    if (!passcode || passcode.trim() !== expectedPasscode.trim()) {
      this.logger.warn(
        `[SECURITY ALERT] Rejected unauthorized admin registration attempt for email: "${email}". Invalid passcode provided.`
      );
      throw new HttpException(
        {
          status: 'error',
          field: 'passcode',
          message: 'Invalid admin authorization passcode. Registration denied.',
        },
        HttpStatus.FORBIDDEN, // 403 Forbidden
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    let sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : undefined;
    if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
      sanitizedPhone = `+${sanitizedPhone}`;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    // 2. Pre-flight check against existing admins and users
    const [existingAdmin, existingUser] = await Promise.all([
      this.prisma.admin.findUnique({ where: { email: normalizedEmail } }),
      this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          deletedAt: null,
        },
      }),
    ]);

    if (existingAdmin || existingUser) {
      throw new HttpException(
        {
          status: 'error',
          field: 'email',
          message: 'An administrator or user account with this email already exists.',
        },
        HttpStatus.CONFLICT,
      );
    }

    if (!this.supabaseAdmin) {
      throw new HttpException(
        'Authentication service is unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3. Create Admin user in Supabase Auth with admin claims
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
      },
      user_metadata: {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        full_name: fullName,
        phone: sanitizedPhone,
        role: 'admin',
      },
    });

    if (authError) {
      this.logger.error(`Supabase Admin Auth creation failed: ${authError.message}`);
      if (
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already associated') ||
        authError.message.toLowerCase().includes('unique')
      ) {
        throw new HttpException(
          {
            status: 'error',
            field: 'email',
            message: 'An account with this email already exists.',
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(authError.message, HttpStatus.BAD_REQUEST);
    }

    const userId = authData.user.id;

    // 4. Atomic PostgreSQL transaction: record in public.admins AND public.users
    const [adminRecord] = await this.prisma.$transaction([
      this.prisma.admin.upsert({
        where: { email: normalizedEmail },
        create: {
          id: userId,
          email: normalizedEmail,
          role: 'admin',
        },
        update: {
          role: 'admin',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: normalizedEmail,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          phone: sanitizedPhone || null,
          role: 'admin',
        },
        update: {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          phone: sanitizedPhone || null,
          role: 'admin',
        },
      }),
    ]);

    this.logger.log(
      `[ADMIN REGISTERED] Administrator account provisioned: ${adminRecord.id} (${adminRecord.email}) with verified passcode`
    );

    return {
      status: 'success',
      message: 'Administrator account registered successfully.',
      admin: adminRecord,
    };
  }
}
