'use strict'

const User = require('../model/user/User')
const UserDao = require('../dao/UserDao')

module.exports = class AuthenticationService {
    constructor() {
        this.userDao = new UserDao()
    }

    async getUser(userId) {
        return await this.userDao.getUser(userId)
    }

    async createUser(registerRequest) {
        const user = new User(registerRequest)
        return await this.userDao.createUser(user)
    }

    async updateUser(existingUser, updateRequest) {
        // TODO - make this a little more dynamic
        existingUser.firstName = updateRequest.firstName ? updateRequest.firstName : existingUser.firstName
        existingUser.lastName = updateRequest.lastName ? updateRequest.lastName : existingUser.lastName

        return await this.userDao.updateUser(existingUser)
    }
}