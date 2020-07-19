'use strict'

const AWS = require('aws-sdk')

module.exports = class AuthenticationDao {
    constructor() {
        this.cognito = new AWS.CognitoIdentityServiceProvider()
        this.clientId = process.env.PUBLIC_USER_POOL_CLIENT_ID
    }

    async register(request) {
        return await this.cognito.signUp({
            ClientId: this.clientId,
            Password: request.password,
            Username: request.username
        }).promise()
    }

    async login(request) {
        return await this.cognito.initiateAuth({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.clientId,
            AuthParameters: {
                PASSWORD: request.password,
                USERNAME: request.username
            },
        }).promise()
    }

    async logout(request) {
        return await this.cognito.globalSignOut({
            AccessToken: request.accessToken,
        }).promise()
    }
}