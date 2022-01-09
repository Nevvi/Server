'use strict';

import {UserNotFoundError} from '../error/Errors';

import {RegisterRequest} from '../model/request/RegisterRequest';
import {UpdateRequest} from '../model/request/UpdateRequest';

import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
const userService = new UserService()

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

export const createUser: Handler = async (event) => {
    try{
        console.log("Received request to create user")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body.email, body.phoneNumber)
        request.validate()
        const user = await userService.createUser(request)
        return createResponse(201, user)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const updateUser: Handler = async (event) => {
    try{
        console.log("Received request to update user")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateRequest(body.firstName, body.lastName)
        request.validate(body)

        // validate user exists with that username
        const {userId} = event.pathParameters
        const existingUser = await getUserById(userId)

        // update the info on that user
        const updatedUser = await userService.updateUser(existingUser, request)

        return createResponse(200, updatedUser)
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