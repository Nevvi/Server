'use strict';

const RegisterRequest = require('../model/request/RegisterRequest')
const LoginRequest = require('../model/request/LoginRequest')
const LogoutRequest = require('../model/request/LogoutRequest')

const AuthenticationService = require('../service/AuthenticationService')
const authenticationService = new AuthenticationService()

module.exports.register = async (event) => {
    try{
        console.log("Received request to create an account")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body)
        request.validate()
        const registerResponse = await authenticationService.register(request)
        return createResponse(200, registerResponse)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.login = async (event) => {
    try{
        console.log("Received request to login")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new LoginRequest(body)
        request.validate()
        const loginResponse = await authenticationService.login(request)
        return createResponse(200, loginResponse)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.logout = async (event) => {
    try{
        console.log("Received request to logout")
        const accessToken = event.headers.AccessToken || event.headers.accesstoken
        const request = new LogoutRequest(accessToken)
        request.validate()
        const logoutResponse = await authenticationService.logout(request)
        return createResponse(200, logoutResponse)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}