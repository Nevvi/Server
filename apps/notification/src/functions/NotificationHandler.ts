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

/**
 * {
 *   Records: [
 *     {
 *       messageId: '3893134d-697c-48ca-9479-3f733bf732db',
 *       receiptHandle: ...,
 *       body: '{ "userId": "abc-123", "title": "Hello, World", "body": "Hey from server!" }',
 *       attributes: [Object],
 *       messageAttributes: {},
 *       md5OfBody: 'df2118f71df5bb86a3bfdc377505861b',
 *       eventSource: 'aws:sqs',
 *       eventSourceARN: 'arn:aws:sqs:us-east-1:275527036335:notifications-dev',
 *       awsRegion: 'us-east-1'
 *     }
 *   ]
 * }
 */

export const sendNotification: Handler = async (event) => {
    try{
        console.log("Received request to send notification(s)")

        const records: [any] = event.Records ? event.Records : []
        for (const record of records) {
            try {
                const details = JSON.parse(record.body)
                const {userId, title, body} = details
                console.log(`Sending notification to ${userId}`)
                await service.sendNotification(userId, title, body)
            } catch (e: any) {
                console.log("Caught error sending notification", e)
            }
        }
    } catch (e: any) {
        console.log("Caught error sending notifications", e)
    }

    // Always return true no matter what
    return true
}

function createResponse(statusCode: number, body: object) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}