import { IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('EG')
    phoneNumber: string;
}