'use strict'

import {Handler} from "aws-lambda";

const AbstractAuthorizer = require('../../../../shared/common/authorization/AbstractAuthorizer')
const {AuthPolicy, HttpVerb} = require('../../../../shared/common/authorization/AuthPolicy')

class UserAuthorizer extends AbstractAuthorizer {
    generatePermissions(authPolicy: typeof AuthPolicy, userId: string) {
        if (userId) {
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/search`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/notify`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}`)
            authPolicy.allowMethod(HttpVerb.PATCH, `/v1/users/${userId}`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/image`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/image`)

            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/suggestions`)
            authPolicy.allowMethod(HttpVerb.DELETE, `/v1/users/${userId}/suggestions/*`)

            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connections`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connections/suggested`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connections/rejected`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connections/*`)
            authPolicy.allowMethod(HttpVerb.PATCH, `/v1/users/${userId}/connections/*`)
            authPolicy.allowMethod(HttpVerb.DELETE, `/v1/users/${userId}/connections/*`)

            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connections/requests/pending`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connections/requests`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connections/requests/confirm`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connections/requests/deny`)

            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connection-groups`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connection-groups`)
            authPolicy.allowMethod(HttpVerb.DELETE, `/v1/users/${userId}/connection-groups/*`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connection-groups/*/export`)
            authPolicy.allowMethod(HttpVerb.GET, `/v1/users/${userId}/connection-groups/*/connections`)
            authPolicy.allowMethod(HttpVerb.POST, `/v1/users/${userId}/connection-groups/*/connections`)
            authPolicy.allowMethod(HttpVerb.DELETE, `/v1/users/${userId}/connection-groups/*/connections`)
        } else {
            authPolicy.denyAllMethods()
        }
    }
}

const authorizer = new UserAuthorizer()

export const authorize: Handler = async (event) => {
    return await authorizer.authorize(event)
}