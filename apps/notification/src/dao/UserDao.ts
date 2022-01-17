'use strict'

import {SNS} from "aws-sdk";
import {PublishResponse} from "aws-sdk/clients/sns";

const AWS = require('aws-sdk')
const UserHttpClient = require('../../../../shared/common/http/user/UserHttpClient')

class UserDao {
    private client: typeof UserHttpClient
    private sns: SNS
    constructor() {
        this.client = new UserHttpClient(
            process.env.USER_API_URL,
            process.env.API_CLIENT_ID,
            process.env.API_CLIENT_SECRET,
            process.env.USER_API_SCOPES,
        )

        this.sns = new AWS.SNS({})
    }

    async getUserByPhone(phoneNumber: string): Promise<any> {
        try {
            return await this.client.getUserByPhoneNumber(phoneNumber)
        } catch (e: any) {
            console.log("Failed to get user", e.response && e.response.data)
            return null
        }
    }

    async sendMessage(phoneNumber: string, message: string): Promise<PublishResponse> {
        return await this.sns.publish({
            Message: message,
            PhoneNumber: phoneNumber
        }).promise()
    }
}

export {UserDao}