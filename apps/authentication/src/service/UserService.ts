'use strict'

import {UserDao} from "../dao/UserDao";

class UserService {
    private userDao: UserDao;

    constructor() {
        this.userDao = new UserDao()
    }

    async createUser(id: string, email: string) {
        try {
            console.log("Creating user", id, email)
            return await this.userDao.createUser(id, email)
        } catch (e) {
            console.log(`Failed to create user`, e)
            throw e
        }
    }

    async confirmUserPhoneNumber(id: string) {
        try {
            console.log("Confirming user phone number", id)
            return await this.userDao.confirmUserPhoneNumber(id)
        } catch (e) {
            console.log(`Failed to confirm user phone number`, e)
            throw e
        }
    }
}

export {UserService}