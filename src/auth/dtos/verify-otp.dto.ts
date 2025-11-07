import { IsNotEmpty, IsPhoneNumber, IsString, Length } from "class-validator";

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('EG')
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otp: string;
}