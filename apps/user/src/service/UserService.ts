'use strict'

import {User} from '../model/user/User';
import {UserDao} from '../dao/UserDao';
import {RegisterRequest} from "../model/request/RegisterRequest";
import {UpdateRequest} from "../model/request/UpdateRequest";
import {UpdateContactRequest} from "../model/request/UpdateContactRequest";
import {AuthenticationDao} from "../dao/AuthenticationDao";
import {Address} from "../model/user/Address";
import {SearchRequest} from "../model/request/SearchRequest";
import {SearchResponse} from "../model/response/SearchResponse";
import {ImageDao} from "../dao/ImageDao";
import {InvalidRequestError, UserNotFoundError} from "../error/Errors";
import {S3} from "aws-sdk";

class UserService {
    private userDao: UserDao;
    private imageDao: ImageDao;
    private authenticationDao: AuthenticationDao;
    constructor() {
        this.userDao = new UserDao()
        this.authenticationDao = new AuthenticationDao()
        this.imageDao = new ImageDao()
    }

    async getUser(userId: string): Promise<User | null> {
        return await this.userDao.getUser(userId)
    }

    async createUser(request: RegisterRequest): Promise<User> {
        const user = new User(request)
        user.emailConfirmed = true
        return await this.userDao.createUser(user)
    }

    async searchUsers(request: SearchRequest): Promise<SearchResponse> {
        // There should only be one user with a confirmed email or phone
        if (request.email) {
            const user = await this.userDao.getUserByEmail(request.email)
            return new SearchResponse(user ? [user] : [])
        } else if (request.phoneNumber) {
            const user = await this.userDao.getUserByPhone(request.phoneNumber)
            return new SearchResponse(user ? [user] : [])
        }

        return await this.userDao.searchUsers(request.name, request.continuationKey, request.limit)
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

    async updateUserImage(userId: string, image: Buffer, imageName: string, contentType: string): Promise<User> {
        const user = await this.getUser(userId)
        if (!user) {
            throw new UserNotFoundError(userId)
        }

        user.profileImage = await this.imageDao.uploadImage(userId, image, imageName, contentType)
        return await this.userDao.updateUser(user)
    }
}

export {UserService}