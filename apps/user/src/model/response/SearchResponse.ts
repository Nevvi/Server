'use strict'

import {SlimUser} from "../user/SlimUser";

class SearchResponse {
    users: SlimUser[]
    count: number

    constructor(users: SlimUser[], count: number) {
        this.users = users
        this.count = count
    }
}

export {SearchResponse}