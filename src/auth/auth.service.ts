import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(phoneNumber: string) {
    return {
      message: 'OTP has been sent to your phone number',
    };
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    if (otp !== '123456') {
      throw new BadRequestException('Invalid OTP');
    }

    let user = await this.usersService.getUserByPhoneNumber(phoneNumber);

    if (!user) {
      user = await this.usersService.createUser({ phoneNumber });
    }

    let session = await this.usersService.getUserSessionForUser(user.id);

    if (!session) {
      session = await this.usersService.createUserSession(user.id);
    }

    return {
      message: 'Login successful',
      token: session.token,
    };
  }
}
