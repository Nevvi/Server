'use strict';

import {Handler} from 'aws-lambda';
import {RegisterRequest} from '../model/request/RegisterRequest';
import {LoginRequest} from '../model/request/LoginRequest';
import {LogoutRequest} from '../model/request/LogoutRequest';

import {AuthenticationService} from '../service/AuthenticationService';
import {ConfirmRequest} from "../model/request/ConfirmRequest";
const authenticationService = new AuthenticationService()

export const register: Handler = async (event: any) => {
    try {
        console.log("Received request to create an account")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body.email, body.phoneNumber, body.password)
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
        const request = new ConfirmRequest(body.username, body.confirmationCode)
        request.validate()
        const confirmResponse = await authenticationService.confirm(request)
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

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}