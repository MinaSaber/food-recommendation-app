import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prsima/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateUserSessionDto } from './dtos/create-user-session.dto';
import { UserSession } from '../../generated/prisma/client.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
      },
    });
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: {
        phoneNumber,
      },
    });
  }

  async getUserSessionForUser(userId: number) {
    return this.prisma.userSession.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async createUserSession(
    createUserSessionDto: CreateUserSessionDto,
  ): Promise<UserSession> {
    return this.prisma.userSession.create({
      data: {
        ...createUserSessionDto,
      },
    });
  }
}
