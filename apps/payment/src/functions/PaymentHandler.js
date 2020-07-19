'use strict';

const PaymentService = require("../service/PaymentService")
const service = new PaymentService()

module.exports.createToken = async (event) => {
    try{
        console.log("Received request to create payment token")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const {customerId} = body
        const token = await service.createToken(customerId)
        return createResponse(201, token)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

module.exports.createTransaction = async (event) => {
    try{
        console.log("Received request to create payment transaction")
        const body = typeof event.body === 'object' ? event.body : JSON.parse(event.body)
        const {sessionId, amount} = body
        const transaction = await service.createTransaction(sessionId, amount)
        return createResponse(201, transaction)
    } catch (e) {
        return createResponse(e.statusCode, e.message)
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode: statusCode || 500,
        body: JSON.stringify(body)
    }
}