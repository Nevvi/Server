'use strict'

import {Handler} from "aws-lambda";

const AbstractAuthorizer = require('../../../../shared/common/authorization/AbstractAuthorizer')
const {AuthPolicy, HttpVerb} = require('../../../../shared/common/authorization/AuthPolicy')

class UserAuthorizer extends AbstractAuthorizer {
    generatePermissions(authPolicy: typeof AuthPolicy, userId: string) {
        authPolicy.denyAllMethods()
    }
}

const authorizer = new UserAuthorizer()

export const authorize: Handler = async (event) => {
    return await authorizer.authorize(event)
}