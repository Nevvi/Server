'use strict'

const AuthenticationHttpClient = require('../../../../shared/common/http/authentication/AuthenticationHttpClient')

class AuthenticationDao {
    private client: any;
    constructor() {
        this.client = new AuthenticationHttpClient(
            process.env.AUTHENTICATION_API_URL,
            process.env.API_CLIENT_ID,
            process.env.API_CLIENT_SECRET,
            process.env.USER_API_SCOPES,
        )
    }

    async updateUser(id: string, phoneNumber: string) {
        try {
            return await this.client.updateUser(id, phoneNumber)
        } catch (e) {
            console.log(`Failed to update user`, e)
            throw e
        }
    }
}

export {AuthenticationDao}