'use strict'

import {Handler} from "aws-lambda";

const AbstractAuthorizer = require('../../../../shared/common/authorization/AbstractAuthorizer')
const {AuthPolicy, HttpVerb} = require('../../../../shared/common/authorization/AuthPolicy')

class NotificationAuthorizer extends AbstractAuthorizer {
    generatePermissions(authPolicy: typeof AuthPolicy, userId: string) {
        if (userId) {
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/notifications/token`)
        } else {
            authPolicy.denyAllMethods()
        }
    }
}

const authorizer = new NotificationAuthorizer()

export const authorize: Handler = async (event) => {
    return await authorizer.authorize(event)
}