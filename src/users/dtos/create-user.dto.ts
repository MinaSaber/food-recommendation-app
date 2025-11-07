import { IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('EG')
    phoneNumber: string;
}