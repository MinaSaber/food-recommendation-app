import { Module } from "@nestjs/common";
import { UsersController } from "./users.controllers";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { PrismaClient } from "@prisma/client";

@Module({
  imports: [PrismaClient],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}