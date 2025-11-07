import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserSessionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsDate()
  @IsNotEmpty()
  expiresAt: Date;
}
