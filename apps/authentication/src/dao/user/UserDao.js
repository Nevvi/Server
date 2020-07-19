'use strict'

const UserHttpClient = require('../../../../../shared/common/http/user/UserHttpClient')

module.exports = class UserDao {
    constructor() {
        this.client = new UserHttpClient(
            process.env.USER_API_URL,
            process.env.API_CLIENT_ID,
            process.env.API_CLIENT_SECRET,
            process.env.USER_API_SCOPES,
        )
    }

    async createUser(username) {
        try {
            return await this.client.createUser({username})
        } catch (e) {
            console.log(`Failed to create user`, e)
            throw e
        }
    }
}