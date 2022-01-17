'use strict'

const UserHttpClient = require('../../../../shared/common/http/user/UserHttpClient')

class UserDao {
    private client: typeof UserHttpClient
    constructor() {
        this.client = new UserHttpClient(
            process.env.USER_API_URL,
            process.env.API_CLIENT_ID,
            process.env.API_CLIENT_SECRET,
            process.env.USER_API_SCOPES,
        )
    }

    async getUserByPhone(phoneNumber: string): Promise<any> {
        try {
            return await this.client.getUserByPhoneNumber(phoneNumber)
        } catch (e: any) {
            console.log("Failed to get user", e.response && e.response.data)
            return null
        }
    }
}

export {UserDao}