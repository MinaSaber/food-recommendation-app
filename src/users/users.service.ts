import { CreateUserSessionDto } from './dtos/create-user-session.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersRepository } from './users.repository';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.usersRepository.createUser(createUserDto);
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    return this.usersRepository.getUserByPhoneNumber(phoneNumber);
  }

  async getUserSessionForUser(userId: number) {
    return this.usersRepository.getUserSessionForUser(userId);
  }

  async createUserSession(userId: number) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    const JWT_SECRET = this.configService.get('JWT_SECRET');

    const payload = {
      userId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = jwt.sign(payload, JWT_SECRET);

    const createUserSessionDto: CreateUserSessionDto = {
      userId,
      token,
      expiresAt,
    };

    return this.usersRepository.createUserSession(createUserSessionDto);
  }
}
