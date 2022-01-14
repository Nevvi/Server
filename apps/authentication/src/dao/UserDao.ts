'use strict'

import {CognitoIdentityServiceProvider} from "aws-sdk";
import {LoginRequest} from "../model/request/LoginRequest";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {
    AdminGetUserResponse, AdminUpdateUserAttributesResponse,
    ConfirmSignUpRequest, ConfirmSignUpResponse, GetUserAttributeVerificationCodeResponse, GetUserResponse,
    GlobalSignOutResponse,
    InitiateAuthResponse,
    SignUpResponse, UpdateUserAttributesResponse, UserType, VerifyUserAttributeResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmSignupRequest} from "../model/request/ConfirmSignupRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";
import {SendCodeRequest} from "../model/request/SendCodeRequest";
import {ConfirmCodeRequest} from "../model/request/ConfirmCodeRequest";

const AWS = require('aws-sdk')

class UserDao {
    private cognito: CognitoIdentityServiceProvider;
    private clientId: string;
    private userPoolId: string;
    constructor() {
        this.cognito = new AWS.CognitoIdentityServiceProvider()
        // @ts-ignore
        this.clientId = process.env.PUBLIC_USER_POOL_CLIENT_ID
        // @ts-ignore
        this.userPoolId = process.env.PUBLIC_USER_POOL_ID
    }

    async getUser(userId: string): Promise<AdminGetUserResponse> {
        return await this.cognito.adminGetUser({
            Username: userId,
            UserPoolId: this.userPoolId
        }).promise()
    }

    async getUserByEmail(email: string): Promise<UserType | null> {
        const users = await this.cognito.listUsers({
            UserPoolId: this.userPoolId,
            Filter: `email=\"${email}\"`
        }).promise()

        return users.Users?.length === 1 ? users.Users[0] : null
    }

    async getUserByPhone(phoneNumber: string): Promise<UserType | null> {
        const users = await this.cognito.listUsers({
            UserPoolId: this.userPoolId,
            Filter: `phone_number=\"${phoneNumber}\"`
        }).promise()

        return users.Users?.length === 1 ? users.Users[0] : null
    }

    async updateUser(username: string, request: UpdateRequest): Promise<AdminUpdateUserAttributesResponse> {
        const attributes = []
        if (request.name) {
            attributes.push({Name: "name", Value: request.name})
        }
        if (request.phoneNumber) {
            attributes.push({Name: "phone_number", Value: request.phoneNumber})
        }

        return await this.cognito.adminUpdateUserAttributes({
            Username: username,
            UserPoolId: this.userPoolId,
            UserAttributes: attributes
        }).promise()
    }

    async register(request: RegisterRequest): Promise<SignUpResponse> {
        return await this.cognito.signUp({
            ClientId: this.clientId,
            Password: request.password,
            Username: request.email,
            UserAttributes: [
                {Name: "email", Value: request.email}
            ]
        }).promise()
    }

    async confirm(request: ConfirmSignupRequest): Promise<ConfirmSignUpResponse> {
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

    async sendVerificationCode(request: SendCodeRequest): Promise<GetUserAttributeVerificationCodeResponse> {
        return await this.cognito.getUserAttributeVerificationCode({
            AccessToken: request.accessToken,
            AttributeName: request.attributeName
        }).promise()
    }

    async verifyCode(request: ConfirmCodeRequest): Promise<VerifyUserAttributeResponse> {
        return await this.cognito.verifyUserAttribute({
            AccessToken: request.accessToken,
            AttributeName: request.attributeName,
            Code: request.code
        }).promise()
    }
}

export {UserDao}