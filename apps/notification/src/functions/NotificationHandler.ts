'use strict';

import {Handler} from "aws-lambda";
import {NotificationService} from "../service/NotificationService";
import {UpdateTokenRequest} from "../model/request/UpdateTokenRequest";

const service = new NotificationService()

export const updateDeviceToken: Handler = async (event) => {
    try{
        console.log("Received request to update device token")
        const {userId} = event.pathParameters
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const request = new UpdateTokenRequest(userId, body.token)
        request.validate()

        await service.updateToken(request)
        return createResponse(200, {})
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