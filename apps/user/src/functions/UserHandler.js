'use strict';

const {UserNotFoundError} = require('../error/Errors')

const RegisterRequest = require('../model/request/RegisterRequest')
const UpdateRequest = require('../model/request/UpdateRequest')

const UserService = require('../service/UserService')
const userService = new UserService()

module.exports.getUser = async (event) => {
    try{
        console.log("Received request to get user")
        const {userId} = event.pathParameters
        const user = await getUser(userId)
        return createResponse(200, user)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.createUser = async (event) => {
    try{
        console.log("Received request to create user")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new RegisterRequest(body)
        request.validate()
        const user = await userService.createUser(request)
        return createResponse(201, user)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.updateUser = async (event) => {
    try{
        console.log("Received request to update user")

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateRequest(body)
        request.validate(body)

        // validate user exists with that username
        const {userId} = event.pathParameters
        const existingUser = await getUser(userId)

        // update the info on that user
        const updatedUser = await userService.updateUser(existingUser, request)

        return createResponse(200, updatedUser)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

async function getUser(userId) {
    const user = await userService.getUser(userId)

    if (!user) {
        throw new UserNotFoundError(userId)
    }

    return user
}

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}