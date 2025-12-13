import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { Public } from '../shared/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@/shared/decorators/current-user.decorator';
import { UsersService } from '@/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.phoneNumber);
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otp,
    );
  }

  @Post('logout')
  async logout(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.inactiveUserSession(user.id);
  }
}
