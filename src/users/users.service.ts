import { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
}