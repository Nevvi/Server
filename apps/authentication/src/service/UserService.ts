'use strict'

import {UserDao} from "../dao/UserDao";

class UserService {
    private userDao: UserDao;

    constructor() {
        this.userDao = new UserDao()
    }

    async createUser(id: string, email: string) {
        try {
            return await this.userDao.createUser(id, email)
        } catch (e) {
            console.log(`Failed to create user`, e)
            throw e
        }
    }
}

export {UserService}