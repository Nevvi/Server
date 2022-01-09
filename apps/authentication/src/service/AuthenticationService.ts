'use strict'

import {AuthenticationDao} from "../dao/AuthenticationDao";
import {UserDao} from '../dao/user/UserDao';
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LoginRequest} from "../model/request/LoginRequest";
import {ConfirmResponse, LoginResponse, LogoutResponse, RegisterResponse} from "../model/response/Response";
import {InvalidRequestError} from "../error/Errors";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {SignUpResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmRequest} from "../model/request/ConfirmRequest";

class AuthenticationService {
    private authenticationDao: AuthenticationDao;
    private userDao: UserDao;
    constructor() {
        this.authenticationDao = new AuthenticationDao()
        this.userDao = new UserDao()
    }

    async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        // create authentication account
        const signUpResponse: SignUpResponse = await this.authenticationDao.register(registerRequest)

        // create profile
        await this.userDao.createUser(registerRequest.email, registerRequest.phoneNumber)

        return new RegisterResponse(signUpResponse)
    }

    async confirm(confirmRequest: ConfirmRequest) {
        return await this.authenticationDao.confirm(confirmRequest)
    }

    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        const authResult = await this.authenticationDao.login(loginRequest)

        if (authResult === undefined) {
            throw new InvalidRequestError("Received undefined login response")
        }

        return new LoginResponse(loginRequest.username, authResult.AuthenticationResult!);
    }

    async logout(logoutRequest: LogoutRequest): Promise<LogoutResponse> {
        await this.authenticationDao.logout(logoutRequest)
        return new LogoutResponse()
    }
}

export {AuthenticationService}