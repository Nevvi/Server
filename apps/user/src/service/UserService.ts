'use strict'

import {User} from '../model/user/User';
import {UserDao} from '../dao/UserDao';
import {RegisterRequest} from "../model/request/RegisterRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";
import {UpdateContactRequest} from "../model/request/UpdateContactRequest";
import {AuthenticationDao} from "../dao/AuthenticationDao";
import {Address} from "../model/user/Address";

class UserService {
    private userDao: UserDao;
    private authenticationDao: AuthenticationDao;
    constructor() {
        this.userDao = new UserDao()
        this.authenticationDao = new AuthenticationDao()
    }

    async getUser(userId: string): Promise<User | null> {
        return await this.userDao.getUser(userId)
    }

    async createUser(request: RegisterRequest): Promise<User> {
        const user = new User(request)
        return await this.userDao.createUser(user)
    }

    async updateUser(existingUser: User, request: UpdateRequest): Promise<User> {
        // Need to send new phone number over to auth service to get confirmed
        // once confirmed it will call back here so that we can keep track that it was confirmed
        if (request.phoneNumber && existingUser.phoneNumber !== request.phoneNumber) {
            // TODO - also validate that phone number isn't already being used and confirmed
            await this.authenticationDao.updateUser(existingUser.id, request.phoneNumber)
        }

        // TODO - make this a little more dynamic
        existingUser.firstName = request.firstName ? request.firstName : existingUser.firstName
        existingUser.lastName = request.lastName ? request.lastName : existingUser.lastName
        existingUser.phoneNumber = request.phoneNumber ? request.phoneNumber : existingUser.phoneNumber
        existingUser.address = request.address ? new Address(request.address) : existingUser.address

        return await this.userDao.updateUser(existingUser)
    }

    async updateUserContact(existingUser: User, request: UpdateContactRequest): Promise<User> {
        // TODO - validate this new email or phone number doesn't already exist
        existingUser.email = request.email ? request.email : existingUser.email
        existingUser.emailConfirmed = request.emailConfirmed

        existingUser.phoneNumber = request.phoneNumber ? request.phoneNumber : existingUser.phoneNumber
        existingUser.phoneNumberConfirmed = request.phoneNumberConfirmed

        return await this.userDao.updateUser(existingUser)
    }
}

export {UserService}