'use strict'

import {User} from '../model/user/User';
import {UserDao} from '../dao/UserDao';
import {RegisterRequest} from "../model/request/RegisterRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";

class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async getUser(userId: string): Promise<User | null> {
        return await this.userDao.getUser(userId)
    }

    async createUser(request: RegisterRequest): Promise<User> {
        const user = new User(request)
        return await this.userDao.createUser(user)
    }

    async updateUser(existingUser: User, request: UpdateRequest): Promise<User> {
        // TODO - make this a little more dynamic
        existingUser.firstName = request.firstName ? request.firstName : existingUser.firstName
        existingUser.lastName = request.lastName ? request.lastName : existingUser.lastName

        return await this.userDao.updateUser(existingUser)
    }
}

export {UserService}