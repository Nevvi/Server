'use strict'

const UserHttpClient = require('../../../../../shared/common/http/user/UserHttpClient')

class UserDao {
    private client: any;
    constructor() {
        this.client = new UserHttpClient(
            process.env.USER_API_URL,
            process.env.API_CLIENT_ID,
            process.env.API_CLIENT_SECRET,
            process.env.USER_API_SCOPES,
        )
    }

    async createUser(id: string, email: string, phoneNumber: string) {
        try {
            return await this.client.createUser({id, email, phoneNumber})
        } catch (e) {
            console.log(`Failed to create user`, e)
            throw e
        }
    }
}

export {UserDao}