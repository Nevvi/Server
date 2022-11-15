'use strict'

import {AuthenticationDao} from "../dao/AuthenticationDao";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LoginRequest} from "../model/request/LoginRequest";
import {ConfirmResponse, LoginResponse, LogoutResponse, RegisterResponse} from "../model/response/Response";
import {InvalidRequestError} from "../error/Errors";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {AdminGetUserResponse, SignUpResponse, UserType} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmSignupRequest} from "../model/request/ConfirmSignupRequest";
import {ConfirmCodeRequest} from "../model/request/ConfirmCodeRequest";
import {SendCodeRequest} from "../model/request/SendCodeRequest";
import {User} from "../model/User";

class AuthenticationService {
    private authenticationDao: AuthenticationDao;
    constructor() {
        this.authenticationDao = new AuthenticationDao()
    }

    async getUser(userId: string): Promise<User> {
        const response = await this.authenticationDao.getUser(userId)
        return this._mapToUser(response)
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const response = await this.authenticationDao.getUserByEmail(email)
        if (!response) {
            return null
        }

        return this._mapToUserFromUserType(response)
    }

    async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        // create authentication account
        const signUpResponse: SignUpResponse = await this.authenticationDao.register(registerRequest)

        return new RegisterResponse(signUpResponse)
    }

    async confirm(confirmRequest: ConfirmSignupRequest): Promise<ConfirmResponse> {
        return await this.authenticationDao.confirm(confirmRequest)
    }

    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        const authResult = await this.authenticationDao.login(loginRequest)

        if (authResult === undefined) {
            throw new InvalidRequestError("Received undefined login response")
        }

        let user = await this.authenticationDao.getUserByEmail(loginRequest.username)
        if (!user) {
            user = await this.authenticationDao.getUserByPhone(loginRequest.username)
        }

        return new LoginResponse(user?.Username!, authResult.AuthenticationResult!);
    }

    async logout(logoutRequest: LogoutRequest): Promise<LogoutResponse> {
        await this.authenticationDao.logout(logoutRequest)
        return new LogoutResponse()
    }

    async sendCode(request: SendCodeRequest) {
        return await this.authenticationDao.sendVerificationCode(request)
    }

    async confirmCode(request: ConfirmCodeRequest) {
        return await this.authenticationDao.verifyCode(request)
    }

    _mapToUser(response: AdminGetUserResponse): User {
        const attributes = response.UserAttributes!

        // always present after registration
        const userId = attributes.find(a => a.Name === 'sub')!.Value!
        const email = attributes.find(a => a.Name === 'email')!.Value!
        const emailVerified = attributes.find(a => a.Name === 'email_verified')!.Value! === 'true'

        // not always present
        const phone = attributes?.find(a => a.Name === 'phone_number')?.Value
        const phoneVerified = attributes?.find(a => a.Name === 'phone_number_verified')?.Value === 'true'
        const name = attributes?.find(a => a.Name === 'name')?.Value

        return new User(userId, email, emailVerified, phone, phoneVerified, name)
    }

    _mapToUserFromUserType(response: UserType): User {
        const attributes = response.Attributes!

        // always present after registration
        const userId = attributes.find(a => a.Name === 'sub')!.Value!
        const email = attributes.find(a => a.Name === 'email')!.Value!
        const emailVerified = attributes.find(a => a.Name === 'email_verified')!.Value! === 'true'

        // not always present
        const phone = attributes?.find(a => a.Name === 'phone_number')?.Value
        const phoneVerified = attributes?.find(a => a.Name === 'phone_number_verified')?.Value === 'true'
        const name = attributes?.find(a => a.Name === 'name')?.Value

        return new User(userId, email, emailVerified, phone, phoneVerified, name)
    }
}

export {AuthenticationService}