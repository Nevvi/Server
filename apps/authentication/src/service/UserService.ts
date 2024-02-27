'use strict'

import {UserDao} from "../dao/UserDao";

class UserService {
    private userDao: UserDao;

    constructor() {
        this.userDao = new UserDao()
    }

    async createUser(id: string, phoneNumber: string) {
        try {
            console.log("Creating user", id, phoneNumber)
            return await this.userDao.createUser(id, phoneNumber)
        } catch (e) {
            console.log(`Failed to create user`, e)
            throw e
        }
    }

    async confirmUserEmail(id: string) {
        try {
            console.log("Confirming user email", id)
            return await this.userDao.confirmUserEmail(id)
        } catch (e) {
            console.log(`Failed to confirm user email`, e)
            throw e
        }
    }
}

export {UserService}