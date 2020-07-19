'use strict'

const braintree = require("braintree");

module.exports = class PaymentService {
    constructor() {
        this.gateway = braintree.connect({
            environment: process.env.BRAINTREE_ENVIRONMENT === "production" ? braintree.Environment.Production : braintree.Environment.Sandbox,
            merchantId: process.env.MERCHANT_ID,
            publicKey: process.env.PUBLIC_KEY,
            privateKey: process.env.PRIVATE_KEY
        });
    }

    async createToken(customerId) {
        const params = customerId ? {customerId} : {}
        return await this.gateway.clientToken.generate(params)
    }

    async createTransaction(sessionId, amount) {
        return await this.gateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: sessionId,
            options: {
                submitForSettlement: true
            }
        })
    }
}