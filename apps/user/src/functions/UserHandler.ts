'use strict';

import {UserNotFoundError} from '../error/Errors';

import {RegisterRequest} from '../model/request/RegisterRequest';
import {UpdateRequest} from '../model/request/UpdateRequest';

import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
import {UpdateContactRequest} from "../model/request/UpdateContactRequest";
import {SearchRequest} from "../model/request/SearchRequest";
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
        const request = new RegisterRequest(body.id, body.email)
        request.validate()
        const user = await userService.createUser(request)
        return createResponse(201, user)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const updateUserContact: Handler = async (event) => {
    try{
        console.log("Received request to update user contact")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateContactRequest(body.email, body.emailConfirmed, body.phoneNumber, body.phoneNumberConfirmed)
        request.validate(body)

        // validate user exists with that username
        const {userId} = event.pathParameters
        const existingUser = await getUserById(userId)

        // update the info on that user
        const updatedUser = await userService.updateUserContact(existingUser, request)

        return createResponse(200, updatedUser)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const updateUser: Handler = async (event) => {
    try{
        console.log("Received request to update user")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateRequest(body.firstName, body.lastName, body.phoneNumber, body.address)
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

export const searchUsers: Handler = async (event) => {
    try{
        console.log("Received request to search for users")

        // validate incoming request is good
        const searchParams = typeof event.queryStringParameters === 'object' ?
            event.queryStringParameters :
            JSON.parse(event.queryStringParameters)

        const request = new SearchRequest(searchParams.name, searchParams.limit)
        request.validate(searchParams)

        const users = await userService.searchUsers(request)
        return createResponse(200, users)
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