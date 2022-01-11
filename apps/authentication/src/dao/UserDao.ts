'use strict'

import {CognitoIdentityServiceProvider} from "aws-sdk";
import {LoginRequest} from "../model/request/LoginRequest";
import {RegisterRequest} from "../model/request/RegisterRequest";
import {LogoutRequest} from "../model/request/LogoutRequest";
import {
    AdminGetUserResponse, AdminUpdateUserAttributesResponse,
    ConfirmSignUpRequest, ConfirmSignUpResponse, GetUserResponse,
    GlobalSignOutResponse,
    InitiateAuthResponse,
    SignUpResponse, UpdateUserAttributesResponse, UserType
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ConfirmRequest} from "../model/request/ConfirmRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";

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

export {UserDao}