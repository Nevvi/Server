'use strict';

import {Handler} from "aws-lambda";

const PaymentService = require("../service/PaymentService.ts")
const service = new PaymentService()

export const createToken: Handler = async (event) => {
    try{
        console.log("Received request to create payment token")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const {customerId} = body
        const token = await service.createToken(customerId)
        return createResponse(201, token)
    } catch (e: any) {
        return createResponse(e.statusCode, e.message)
    }
}

export const createTransaction: Handler = async (event) => {
    try{
        console.log("Received request to create payment transaction")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const {sessionId, amount} = body
        const transaction = await service.createTransaction(sessionId, amount)
        return createResponse(201, transaction)
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