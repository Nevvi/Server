'use strict'

import {UserDao} from '../dao/UserDao';
import {UpdateRequest} from "../model/request/UpdateRequest";
import {AdminGetUserResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";

class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async getUser(userId: string): Promise<AdminGetUserResponse> {
        return await this.userDao.getUser(userId)
    }

    async updateUser(userId: string, request: UpdateRequest): Promise<AdminGetUserResponse> {
        await this.userDao.updateUser(userId, request)
        return await this.getUser(userId)
    }
}

export {UserService}