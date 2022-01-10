'use strict'

import {UserDao} from "../dao/UserDao";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LoginRequest} from "../model/request/LoginRequest";
import {ConfirmResponse, LoginResponse, LogoutResponse, RegisterResponse} from "../model/response/Response";
import {InvalidRequestError} from "../error/Errors";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {SignUpResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmRequest} from "../model/request/ConfirmRequest";

class AuthenticationService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        // create authentication account
        const signUpResponse: SignUpResponse = await this.userDao.register(registerRequest)

        return new RegisterResponse(signUpResponse)
    }

    async confirm(confirmRequest: ConfirmRequest): Promise<ConfirmResponse> {
        return await this.userDao.confirm(confirmRequest)
    }

    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        const authResult = await this.userDao.login(loginRequest)

        if (authResult === undefined) {
            throw new InvalidRequestError("Received undefined login response")
        }

        let user = await this.userDao.getUserByEmail(loginRequest.username)
        if (!user) {
            user = await this.userDao.getUserByPhone(loginRequest.username)
        }

        return new LoginResponse(user?.Username!, authResult.AuthenticationResult!);
    }

    async logout(logoutRequest: LogoutRequest): Promise<LogoutResponse> {
        await this.userDao.logout(logoutRequest)
        return new LogoutResponse()
    }
}

export {AuthenticationService}