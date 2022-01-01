'use strict'

import {CognitoIdentityServiceProvider} from "aws-sdk";
import {LoginRequest} from "../model/request/LoginRequest";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {
    GlobalSignOutResponse,
    InitiateAuthResponse,
    SignUpResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";

const AWS = require('aws-sdk')

class AuthenticationDao {
    private cognito: CognitoIdentityServiceProvider;
    private clientId: string;
    constructor() {
        this.cognito = new AWS.CognitoIdentityServiceProvider()
        // @ts-ignore
        this.clientId = process.env.PUBLIC_USER_POOL_CLIENT_ID
    }

    async register(request: RegisterRequest): Promise<SignUpResponse> {
        return await this.cognito.signUp({
            ClientId: this.clientId,
            Password: request.password,
            Username: request.username
        }).promise()
    }

    async login(request: LoginRequest): Promise<InitiateAuthResponse> {
        return await this.cognito.initiateAuth({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.clientId,
            AuthParameters: {
                PASSWORD: request.password,
                USERNAME: request.username
            },
        }).promise()
    }

    async logout(request: LogoutRequest): Promise<GlobalSignOutResponse> {
        return await this.cognito.globalSignOut({
            AccessToken: request.accessToken,
        }).promise()
    }
}

export {AuthenticationDao}