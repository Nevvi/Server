'use strict'

import {Handler} from "aws-lambda";

const AbstractAuthorizer = require('../../../../shared/common/authorization/AbstractAuthorizer')
const {AuthPolicy, HttpVerb} = require('../../../../shared/common/authorization/AuthPolicy')

class Authorizer extends AbstractAuthorizer {
    generatePermissions(authPolicy: typeof AuthPolicy, userId: string) {
        if (userId) {
            authPolicy.allowMethod(HttpVerb.POST, `/v1/token`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/transaction`)
        } else {
            authPolicy.denyAllMethods()
        }
    }
}

const authorizer = new Authorizer()

export const authorize: Handler = async (event) => {
    return await authorizer.authorize(event)
}