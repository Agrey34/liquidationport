import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, CheckAccountDto } from './dto/register.dto';

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
   * Secure user registration endpoint.
   * Checks database unique constraints first. Aborts with HTTP 409 if duplicate found.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
