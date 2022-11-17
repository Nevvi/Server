'use strict'

import {User} from "../user/User";

class SearchResponse {
    users: User[]
    constructor(users: User[]) {
        this.users = users
    }
}

export {SearchResponse}