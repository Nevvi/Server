'use strict';

import {UserNotFoundError} from '../error/Errors';

import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
import {RequestConnectionRequest} from "../model/request/RequestConnectionRequest";
const userService = new UserService()

export const requestConnection: Handler = async (event) => {
    try{
        console.log("Received request to get user")
        const {userId} = event.pathParameters
        // validate incoming request is good
        const searchParams = typeof event.queryStringParameters === 'object' ?
            event.queryStringParameters :
            JSON.parse(event.queryStringParameters)

        const request = new RequestConnectionRequest(searchParams.userId)
        request.validate(searchParams)
        const result = await userService.requestConnection(userId, request.userId)

        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

async function getUserById(userId: string) {
    const user = await userService.getUser(userId)

    if (!user) {
        throw new UserNotFoundError(userId)
    }

    return user
}

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}