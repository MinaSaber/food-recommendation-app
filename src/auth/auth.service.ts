import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
    async login(phoneNumber: string) {
        return {
            message: 'OTP has been sent to your phone number',
        }
    }
}