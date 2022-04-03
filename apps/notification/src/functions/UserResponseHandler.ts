'use strict'

import {Handler} from "aws-lambda";
import {UserResponse} from "../model/UserResponse";
import {UserResponseService} from "../service/UserResponseService";

const userResponseService = new UserResponseService()

export const handleUserResponse: Handler = async (event: any) => {
    const records = (event.Records || [])
    console.log(`Received ${records.length} user response(s)`);
    const responses = records.map((record: { Sns: any; }) => {
        const message = JSON.parse(record.Sns.Message)
        return new UserResponse(message.originationNumber, message.messageBody)
    })

    await Promise.all(responses.map((response: UserResponse) => {
        return userResponseService.safeHandleUserResponse(response)
    }))
}
