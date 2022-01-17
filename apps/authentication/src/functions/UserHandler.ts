'use strict';

import {UserNotFoundError} from '../error/Errors';

import {UpdateRequest} from '../model/request/UpdateRequest';

import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
const userService = new UserService()

export const searchUser: Handler = async (event) => {
    try{
        console.log("Received request to search user")
        const {phoneNumber} = (event.queryStringParameters || {})
        const user = await userService.searchUsers(phoneNumber)
        return createResponse(200, user)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getUser: Handler = async (event) => {
    try{
        console.log("Received request to get user")

        const {userId} = event.pathParameters
        const user = await getUserById(userId)
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
        const request = new UpdateRequest(body.phoneNumber, body.name)
        request.validate()

        const {userId} = event.pathParameters
        const updatedUser = await userService.updateUser(userId, request)

        return createResponse(200, updatedUser)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

async function getUserById(userId: string) {
    const user = await userService.getUser(userId)

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