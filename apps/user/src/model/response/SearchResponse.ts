'use strict'

import {User} from "../user/User";

class SearchResponse {
    users: User[]
    continuationKey: string | undefined
    constructor(users: User[], continuationKey: string | undefined = undefined) {
        this.users = users
        this.continuationKey = continuationKey
    }
}

export {SearchResponse}