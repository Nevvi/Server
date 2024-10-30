'use strict';

import {Handler} from 'aws-lambda';
import {RegisterRequest} from '../model/request/RegisterRequest';
import {LoginRequest} from '../model/request/LoginRequest';
import {LogoutRequest} from '../model/request/LogoutRequest';

import {AuthenticationService} from '../service/AuthenticationService';
import {ConfirmSignupRequest} from "../model/request/ConfirmSignupRequest";
import {SendCodeRequest} from "../model/request/SendCodeRequest";
import {ConfirmCodeRequest} from "../model/request/ConfirmCodeRequest";
import {UserService} from "../service/UserService";
import {UpdateRequest} from "../model/request/UpdateRequest";
import {ForgotPasswordRequest} from "../model/request/ForgotPasswordRequest";
import {ResetPasswordRequest} from "../model/request/ResetPasswordRequest";

const authenticationService = new AuthenticationService()
const userService = new UserService()

export const getMinAppVersions: Handler = async (event: any) => {
    try {
        console.log("Received request to get min app versions")
        return createResponse(200, {
            "ios": process.env.MIN_IOS_VERSION
        })
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const register: Handler = async (event: any) => {
    try {
        console.log("Received request to create an account")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body.username, body.password)
        request.validate()
        const registerResponse = await authenticationService.register(request)
        return createResponse(200, registerResponse)
    } catch (e: any) {
        console.log(`Failed to register account for ${JSON.parse(event.body)} due to ${e.message}`)
        return createResponse(e.statusCode, e.message)
    }
}

export const confirm: Handler = async (event: any) => {
    try {
        console.log("Received request to confirm an account")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new ConfirmSignupRequest(body.username, body.confirmationCode)
        request.validate()
        const confirmResponse = await authenticationService.confirm(request)

        // Once user account has been confirmed we can create the user record in the database
        // Need to do this before returning because user will be logging in immediately after
        // this and requesting data
        console.log("User confirmed.. calling user service to create record", body.username)
        const user = await authenticationService.getUserByPhone(body.username)
        console.log("User in cognito", user)
        if (!user) {
            console.log("Didn't find user with expected phone number")
            return createResponse(500, {})
        }
        await userService.createUser(user?.userId, user?.phoneNumber)

        return createResponse(200, confirmResponse)
    } catch (e: any) {
        console.log(`Failed to confirm account for ${JSON.parse(event.body)} due to ${e.message}`)
        return createResponse(e.statusCode, e.message)
    }
}

export const login: Handler = async (event: any) => {
    try {
        console.log("Received request to login")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new LoginRequest(body.username, body.password)
        request.validate()
        const loginResponse = await authenticationService.login(request)
        return createResponse(200, loginResponse)
    } catch (e: any) {
        console.log(`Failed to login due to ${e.message}`)
        return createResponse(e.statusCode, e.message)
    }
}

export const logout: Handler = async (event: any) => {
    try {
        console.log("Received request to logout")
        const accessToken = event.headers.AccessToken || event.headers.accesstoken
        const request = new LogoutRequest(accessToken)
        request.validate()
        const logoutResponse = await authenticationService.logout(request)
        return createResponse(200, logoutResponse)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const forgotPassword: Handler = async (event: any) => {
    try {
        console.log("Received request to forgot password")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new ForgotPasswordRequest(body.username)
        request.validate()
        await authenticationService.forgotPassword(request)
        return createResponse(200, {
            "message": "A verification code has been sent to that number if it exists."
        })
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const confirmForgotPassword: Handler = async (event: any) => {
    try {
        console.log("Received request to confirm a forgotten password")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new ResetPasswordRequest(body.username, body.code, body.password)
        request.validate()
        await authenticationService.confirmForgotPassword(request)
        return createResponse(200, {
            "message": "Password has been reset"
        })
    } catch (e: any) {
        console.log(`Failed to confirm password due to ${e.message}`)
        return createResponse(e.statusCode, e.message)
    }
}


export const sendCode: Handler = async (event: any) => {
    try {
        console.log("Received request to send a new verification code")
        const {attribute} = (event.queryStringParameters || {})
        const accessToken = event.headers.AccessToken || event.headers.accesstoken
        const request = new SendCodeRequest(accessToken, attribute)
        request.validate()
        const response = await authenticationService.sendCode(request)
        return createResponse(200, response)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const confirmCode: Handler = async (event: any) => {
    try {
        console.log("Received request to confirm a verification code")
        const {attribute, code} = (event.queryStringParameters || {})
        const accessToken = event.headers.AccessToken || event.headers.accesstoken
        const request = new ConfirmCodeRequest(accessToken, attribute, code)
        request.validate()

        // If we successfully validate the email we need to update the user
        const userId = await authenticationService.confirmCode(request)
        await userService.confirmUserEmail(userId)

        return createResponse(200, {"message": "Success"})
    } catch (e: any) {
        console.log(`Failed to confirm code for ${event.queryStringParameters} due to ${e.message}`)
        return createResponse(e.statusCode, e.message)
    }
}

export const updateUser: Handler = async (event) => {
    try{
        console.log("Received request to update user")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateRequest(body.email)
        request.validate()

        const {userId} = event.pathParameters
        const updatedUser = await authenticationService.updateUser(userId, request)

        return createResponse(200, updatedUser)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}