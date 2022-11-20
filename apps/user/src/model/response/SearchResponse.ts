'use strict'

import {SlimUserResponse} from "./SlimUserResponse";
import {User} from "../user/User";

class SearchResponse {
    users: SlimUserResponse[]
    continuationKey: string | undefined
    constructor(users: User[], continuationKey: string | undefined = undefined) {
        this.users = users.map(u => new SlimUserResponse(u))
        this.continuationKey = continuationKey
    }
}

export {SearchResponse}