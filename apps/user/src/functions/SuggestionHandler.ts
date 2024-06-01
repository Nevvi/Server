'use strict';


import {SuggestionService} from '../service/SuggestionService';
import {Handler} from "aws-lambda";
const service = new SuggestionService()

export const getSuggestedConnections: Handler = async (event) => {
    try {
        console.log("Received request to get suggested connections")
        const {userId} = event.pathParameters
        const result = await service.getSuggestedUsers(userId)
        return createResponse(200, result)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const ignoreSuggestion: Handler = async (event) => {
    try {
        console.log("Received request to get ignore a suggestion")
        const {userId, suggestionId} = event.pathParameters
        await service.ignoreSuggestion(userId, suggestionId)
        return createResponse(200, {"success": true})
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const refreshAllSuggestions: Handler = async (event) => {
    try {
        console.log("Received request to refresh all suggestion")
        await service.refreshAllSuggestions()
        return createResponse(200, {"success": true})
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
 *       body: '{ "userId": "abc-123" }',
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
export const refreshSuggestions: Handler = async (event) => {
    try{
        console.log("Received request to refresh suggestions(s)")

        const records: [any] = event.Records ? event.Records : []
        for (const record of records) {
            try {
                const details = JSON.parse(record.body)
                const {userId} = details
                await service.refreshSuggestions(userId)
            } catch (e: any) {
                console.log("Caught error refreshing suggestions", e)
            }
        }
    } catch (e: any) {
        console.log("Caught error refreshing suggestions", e)
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