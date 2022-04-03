'use strict'

import {UserDao} from '../dao/UserDao';
import {UpdateRequest} from "../model/request/UpdateRequest";
import {User} from "../model/User";
import {AdminGetUserResponse, UserType} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {InvalidRequestError, UserNotFoundError, UserPhoneNumberAlreadyExistsError} from "../error/Errors";

class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao()
    }

    async searchUsers(phoneNumber: string): Promise<User> {
        if (!phoneNumber) {
            throw new InvalidRequestError("Required phoneNumber to search for users")
        }
        const response = await this.userDao.getUserByPhone(phoneNumber)
        if (!response) {
            throw new UserNotFoundError()
        }
        return this._mapToUserFromUserType(response)
    }

    async getUser(userId: string): Promise<User> {
        const response = await this.userDao.getUser(userId)
        return this._mapToUser(response)
    }

    async updateUser(userId: string, request: UpdateRequest): Promise<User> {
        // Only one phone number can exist per user
        if (request.phoneNumber !== undefined) {
            const user = await this.userDao.getUserByPhone(request.phoneNumber)
            if (user && this._mapToUserFromUserType(user).userId !== userId) {
                throw new UserPhoneNumberAlreadyExistsError(request.phoneNumber)
            }
        }

        await this.userDao.updateUser(userId, request)
        return await this.getUser(userId)
    }

    _mapToUserFromUserType(response: UserType): User {
        const attributes = response.Attributes!

        // always present after registration
        const userId = attributes.find(a => a.Name === 'sub')!.Value!
        const email = attributes.find(a => a.Name === 'email')!.Value!
        const emailVerified = attributes.find(a => a.Name === 'email_verified')!.Value! === 'true'

        // not always present
        const phone = attributes?.find(a => a.Name === 'phone_number')?.Value
        const phoneVerified = attributes?.find(a => a.Name === 'phone_number_verified')?.Value === 'true'
        const name = attributes?.find(a => a.Name === 'name')?.Value

        return new User(userId, email, emailVerified, phone, phoneVerified, name)
    }

    _mapToUser(response: AdminGetUserResponse): User {
        const attributes = response.UserAttributes!

        // always present after registration
        const userId = attributes.find(a => a.Name === 'sub')!.Value!
        const email = attributes.find(a => a.Name === 'email')!.Value!
        const emailVerified = attributes.find(a => a.Name === 'email_verified')!.Value! === 'true'

        // not always present
        const phone = attributes?.find(a => a.Name === 'phone_number')?.Value
        const phoneVerified = attributes?.find(a => a.Name === 'phone_number_verified')?.Value === 'true'
        const name = attributes?.find(a => a.Name === 'name')?.Value

        return new User(userId, email, emailVerified, phone, phoneVerified, name)
    }
}

export {UserService}