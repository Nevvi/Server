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

const authenticationService = new AuthenticationService()
const userService = new UserService()

export const register: Handler = async (event: any) => {
    try {
        console.log("Received request to create an account")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body.email, body.password)
        request.validate()
        const registerResponse = await authenticationService.register(request)
        return createResponse(200, registerResponse)
    } catch (e: any) {
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
        const user = await authenticationService.getUserByEmail(body.user)
        if (!user) {
            return createResponse(500, {})
        }
        await userService.createUser(user?.userId, user?.email)

        return createResponse(200, confirmResponse)
    } catch (e: any) {
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
        const response = await authenticationService.confirmCode(request)
        return createResponse(200, response)
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