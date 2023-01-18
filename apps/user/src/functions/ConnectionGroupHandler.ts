'use strict';


import {UserService} from '../service/UserService';
import {Handler} from "aws-lambda";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {AddConnectionToGroupRequest} from "../model/request/AddConnectionToGroupRequest";
import {RemoveConnectionFromGroupRequest} from "../model/request/RemoveConnectionFromGroupRequest";
import {SearchGroupsRequest} from "../model/request/SearchGroupsRequest";

const userService = new UserService()

export const createGroup: Handler = async (event) => {
    try {
        console.log("Received request to create connection group")
        const {userId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)

        const request = new CreateGroupRequest(userId, body.name)
        request.validate()
        const result = await userService.createGroup(request)

        return createResponse(201, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getGroups: Handler = async (event) => {
    try {
        console.log("Received request to get connection groups")
        const {userId} = event.pathParameters
        const result = await userService.getConnectionGroups(userId)

        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const deleteGroup: Handler = async (event) => {
    try {
        console.log("Received request to delete connection group")
        const {userId, groupId} = event.pathParameters
        const success = await userService.deleteConnectionGroup(userId, groupId)

        return createResponse(success ? 200 : 404, {})
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}


export const exportGroup: Handler = async (event) => {
    try {
        console.log("Received request to export connection group")
        const {userId, groupId} = event.pathParameters
        await userService.exportGroup(userId, groupId)

        return createResponse(200, {})
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getConnections: Handler = async (event) => {
    try {
        console.log("Received request to get connections in group")
        const {userId, groupId} = event.pathParameters

        const queryParams = (event.queryStringParameters || {})
        const searchParams = typeof queryParams === 'object' ? queryParams : JSON.parse(queryParams)
        const name = searchParams.name
        const limit = searchParams.limit ? parseInt(searchParams.limit) : undefined;
        const skip = searchParams.skip ? parseInt(searchParams.skip) : undefined

        const request = new SearchGroupsRequest(userId, name, limit, skip)
        request.validate()

        const result = await userService.searchGroupConnections(groupId, request)

        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const addConnection: Handler = async (event) => {
    try {
        console.log("Received request to add connection to connection group")
        const {userId, groupId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)

        const request = new AddConnectionToGroupRequest(userId, groupId, body.userId)
        request.validate()
        const result = await userService.addConnectionToGroup(request)

        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const removeConnection: Handler = async (event) => {
    try {
        console.log("Received request to add connection to connection group")
        const {userId, groupId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)

        const request = new RemoveConnectionFromGroupRequest(userId, groupId, body.userId)
        request.validate()
        const result = await userService.removeConnectionFromGroup(request)

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