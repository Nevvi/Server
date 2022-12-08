'use strict';


import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
import {RequestConnectionRequest} from "../model/request/RequestConnectionRequest";
import {ConfirmConnectionRequest} from "../model/request/ConfirmConnectionRequest";
import {DenyConnectionRequest} from "../model/request/DenyConnectionRequest";
const userService = new UserService()

export const requestConnection: Handler = async (event) => {
    try{
        console.log("Received request to create connection request")
        const {userId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)

        const request = new RequestConnectionRequest(userId, body.otherUserId, body.permissionGroupName)
        request.validate()
        const result = await userService.requestConnection(request)

        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const confirmConnection: Handler = async (event) => {
    try{
        console.log("Received request to confirm connection request")
        const {userId} = event.pathParameters

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new ConfirmConnectionRequest(body.otherUserId, userId, body.permissionGroupName)
        request.validate()

        const connectionRequest = await userService.confirmConnection(request)
        return createResponse(200, connectionRequest)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const denyConnection: Handler = async (event) => {
    try{
        console.log("Received request to deny connection request")
        const {userId} = event.pathParameters

        // validate incoming request is good
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new DenyConnectionRequest(userId, body.otherUserId)
        request.validate()

        const connectionRequest = await userService.denyConnection(request)
        return createResponse(200, connectionRequest)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getOpenRequests: Handler = async (event) => {
    try{
        console.log("Received request to get pending connections")
        const {userId} = event.pathParameters
        const result = await userService.getPendingConnections(userId)
        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getConnections: Handler = async (event) => {
    try{
        console.log("Received request to get connections")
        const {userId} = event.pathParameters
        const result = await userService.getConnections(userId)
        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getConnection: Handler = async (event) => {
    try{
        console.log("Received request to get connection")
        const {userId, connectedUserId} = event.pathParameters
        const result = await userService.getConnection(userId, connectedUserId)
        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}