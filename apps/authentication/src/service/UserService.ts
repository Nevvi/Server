'use strict'

import {UserDao} from '../dao/UserDao';
import {UpdateRequest} from "../model/request/UpdateRequest";
import {GetUserResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";

class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async getUser(accessToken: string): Promise<GetUserResponse> {
        return await this.userDao.getUser(accessToken)
    }

    async updateUser(accessToken: string, request: UpdateRequest): Promise<GetUserResponse> {
        await this.userDao.updateUser(accessToken, request)
        return await this.getUser(accessToken)
    }
}

export {UserService}