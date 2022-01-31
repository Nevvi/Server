'use strict'

import { Handler } from "aws-lambda";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {NotificationService} from "../service/NotificationService";

const notificationService = new NotificationService()

export const getGroup: Handler = async (event: any) => {
    try {
        console.log("Received request to get user notification group")
        const {userId, groupId} = event.pathParameters
        const response = await notificationService.getNotificationGroupInfo(userId, groupId)
        return createResponse(200, response)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const getGroups: Handler = async (event: any) => {
    try {
        console.log("Received request to get user notification groups")
        const {userId} = event.pathParameters
        const response = await notificationService.getNotificationGroups(userId)
        return createResponse(200, response)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const createGroup: Handler = async (event: any) => {
    try {
        console.log("Received request to create notification group")

        // validate incoming request is good
        const {userId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new CreateGroupRequest(userId, body.name)
        request.validate()

        const response = await notificationService.createNotificationGroup(request)
        return createResponse(201, response)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const sendMessage: Handler = async (event: any) => {
    try {
        console.log("Received request to send message to notification group")

        // validate incoming request is good
        const {userId, groupId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const {message} = body

        const group = await notificationService.getNotificationGroup(userId, groupId)
        await notificationService.sendMessage(group, message)
        return createResponse(201, {message: "Message sent!"})
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