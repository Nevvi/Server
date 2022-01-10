'use strict';

import {UserNotFoundError} from '../error/Errors';

import {UpdateRequest} from '../model/request/UpdateRequest';

import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
const userService = new UserService()

export const getUser: Handler = async (event) => {
    try{
        console.log("Received request to get user")

        const accessToken = event.headers.AccessToken || event.headers.accessToken
        const user = await getUserByToken(accessToken)
        return createResponse(200, user)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const updateUser: Handler = async (event) => {
    try{
        console.log("Received request to update user")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateRequest(body.name)
        request.validate()

        const accessToken = event.headers.AccessToken || event.headers.accessToken
        const updatedUser = await userService.updateUser(accessToken, request)

        return createResponse(200, updatedUser)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

async function getUserByToken(accessToken: string) {
    const user = await userService.getUser(accessToken)

    if (!user) {
        throw new UserNotFoundError()
    }

    return user
}

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}