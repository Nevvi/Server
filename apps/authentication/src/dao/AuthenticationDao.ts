'use strict'

import {CognitoIdentityServiceProvider} from "aws-sdk";
import {LoginRequest} from "../model/request/LoginRequest";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {
    ConfirmSignUpRequest, ConfirmSignUpResponse, GetUserResponse,
    GlobalSignOutResponse,
    InitiateAuthResponse,
    SignUpResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmRequest} from "../model/request/ConfirmRequest";

const AWS = require('aws-sdk')

class AuthenticationDao {
    private cognito: CognitoIdentityServiceProvider;
    private clientId: string;
    constructor() {
        this.cognito = new AWS.CognitoIdentityServiceProvider()
        // @ts-ignore
        this.clientId = process.env.PUBLIC_USER_POOL_CLIENT_ID
    }

    async getUser(accessToken: string): Promise<GetUserResponse> {
        return await this.cognito.getUser({
            AccessToken: accessToken
        }).promise()
    }

    async register(request: RegisterRequest): Promise<SignUpResponse> {
        return await this.cognito.signUp({
            ClientId: this.clientId,
            Password: request.password,
            Username: request.email, // default to email login but phone can be used once verified
            UserAttributes: [
                {Name: "email", Value: request.email},
                {Name: "phone_number", Value: request.phoneNumber}
            ]
        }).promise()
    }

    async confirm(request: ConfirmRequest): Promise<ConfirmSignUpResponse> {
        return await this.cognito.confirmSignUp({
            ClientId: this.clientId,
            Username: request.username,
            ConfirmationCode: request.confirmationCode
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