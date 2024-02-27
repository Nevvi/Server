'use strict'

import {CognitoIdentityServiceProvider} from "aws-sdk";
import {LoginRequest} from "../model/request/LoginRequest";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {
    AdminGetUserResponse, AdminUpdateUserAttributesResponse, ConfirmForgotPasswordResponse,
    ConfirmSignUpResponse, ForgotPasswordResponse, GetUserAttributeVerificationCodeResponse, GetUserResponse,
    GlobalSignOutResponse, InitiateAuthResponse,
    SignUpResponse, UserType, VerifyUserAttributeResponse
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmSignupRequest} from "../model/request/ConfirmSignupRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";
import {SendCodeRequest} from "../model/request/SendCodeRequest";
import {ConfirmCodeRequest} from "../model/request/ConfirmCodeRequest";
import {formatPhoneNumber} from "../util/Utils";

const AWS = require('aws-sdk')

class AuthenticationDao {
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

    async getUserByToken(accessToken: string): Promise<GetUserResponse> {
        return await this.cognito.getUser({
            AccessToken: accessToken
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
        const formatted = formatPhoneNumber(phoneNumber)

        const users = await this.cognito.listUsers({
            UserPoolId: this.userPoolId,
            Filter: `phone_number=\"${formatted}\"`
        }).promise()

        return users.Users?.length === 1 ? users.Users[0] : null
    }

    async updateUser(username: string, request: UpdateRequest): Promise<AdminUpdateUserAttributesResponse> {
        const attributes = []
        if (request.email) {
            attributes.push({Name: "email", Value: request.email})
        }

        return await this.cognito.adminUpdateUserAttributes({
            Username: username,
            UserPoolId: this.userPoolId,
            UserAttributes: attributes
        }).promise()
    }

    async register(request: RegisterRequest): Promise<SignUpResponse> {
        const formatted = formatPhoneNumber(request.username)

        return await this.cognito.signUp({
            ClientId: this.clientId,
            Password: request.password,
            Username: formatted,
            UserAttributes: [
                {Name: "phone_number", Value: formatted}
            ]
        }).promise()
    }

    async confirm(request: ConfirmSignupRequest): Promise<ConfirmSignUpResponse> {
        const formatted = formatPhoneNumber(request.username)

        return await this.cognito.confirmSignUp({
            ClientId: this.clientId,
            Username: formatted,
            ConfirmationCode: request.confirmationCode
        }).promise()
    }

    async login(request: LoginRequest): Promise<InitiateAuthResponse> {
        const formatted = formatPhoneNumber(request.username)

        return await this.cognito.initiateAuth({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.clientId,
            AuthParameters: {
                PASSWORD: request.password,
                USERNAME: formatted
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

    async forgotPassword(username: string): Promise<ForgotPasswordResponse> {
        return await this.cognito.forgotPassword({
            ClientId: this.clientId,
            Username: username
        }).promise()
    }

    async confirmForgotPassword(username: string, code: string, password: string): Promise<ConfirmForgotPasswordResponse> {
        return await this.cognito.confirmForgotPassword({
            ClientId: this.clientId,
            Username: username,
            ConfirmationCode: code,
            Password: password
        }).promise()
    }
}

export {AuthenticationDao}