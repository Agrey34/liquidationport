import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CustomerRegisterDto,
  AdminRegisterDto,
  RegisterDto,
  CheckAccountDto,
} from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Pre-flight account check: verifies email and phone availability
   * before registration or form progression.
   */
  @Post('check-account')
  @HttpCode(HttpStatus.OK)
  async checkAccount(@Body() dto: CheckAccountDto) {
    return this.authService.checkAccountAvailability(dto.email, dto.phone);
  }

  /**
   * Customer / Wholesale Buyer Registration
   * Explicitly assigns and persists the "BUYER" role.
   */
  @Post('customer/register')
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  /**
   * Legacy register endpoint (alias to customer registration for backwards compatibility)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  /**
   * Administrator Registration
   * Requires structural protection / authorization passcode.
   * Prevents unauthorized escalation to the "ADMIN" role.
   */
  @Post('admin/register')
  @HttpCode(HttpStatus.CREATED)
  async registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.authService.registerAdmin(dto);
  }
}
