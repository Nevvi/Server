'use strict'

import {UserDao} from '../dao/UserDao';
import {UpdateRequest} from "../model/request/UpdateRequest";
import {User} from "../model/User";
import {AdminGetUserResponse} from "aws-sdk/clients/cognitoidentityserviceprovider";

class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async getUser(userId: string): Promise<User> {
        const response = await this.userDao.getUser(userId)
        return this._mapToUser(response)
    }

    async updateUser(userId: string, request: UpdateRequest): Promise<User> {
        await this.userDao.updateUser(userId, request)
        return await this.getUser(userId)
    }

    _mapToUser(response: AdminGetUserResponse): User {
        const attributes = response.UserAttributes
        const userId = attributes?.find(a => a.Name === 'sub')?.Value
        const email = attributes?.find(a => a.Name === 'email')?.Value
        const emailVerified = attributes?.find(a => a.Name === 'email_verified')?.Value
        const phone = attributes?.find(a => a.Name === 'phone_number')?.Value
        const phoneVerified = attributes?.find(a => a.Name === 'phone_number_verified')?.Value
        const name = attributes?.find(a => a.Name === 'name')?.Value
        // @ts-ignore
        return new User(userId, email, emailVerified, phone, phoneVerified, name)
    }
}

export {UserService}