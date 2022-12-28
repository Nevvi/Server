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
import {
    AlreadyConnectedError,
    ConnectionDoesNotExistError,
    ConnectionRequestDoesNotExistError,
    ConnectionRequestExistsError,
    InvalidRequestError,
    UserNotFoundError
} from "../error/Errors";
import {RequestStatus} from "../model/connection/RequestStatus";
import {ConnectionDao} from "../dao/ConnectionDao";
import {ConnectionRequest} from "../model/connection/ConnectionRequest";
import {ConfirmConnectionRequest} from "../model/request/ConfirmConnectionRequest";
import {RequestConnectionRequest} from "../model/request/RequestConnectionRequest";
import {DenyConnectionRequest} from "../model/request/DenyConnectionRequest";
import {SlimUser} from "../model/user/SlimUser";
import {UserConnectionResponse} from "../model/response/UserConnectionResponse";
import {PermissionGroup} from "../model/user/PermissionGroup";
import {SearchConnectionsRequest} from "../model/request/SearchConnectionsRequest";

class UserService {
    private userDao: UserDao;
    private imageDao: ImageDao;
    private connectionDao: ConnectionDao;
    private authenticationDao: AuthenticationDao;

    constructor() {
        this.userDao = new UserDao()
        this.authenticationDao = new AuthenticationDao()
        this.imageDao = new ImageDao()
        this.connectionDao = new ConnectionDao()
    }

    async getUser(userId: string): Promise<User | null> {
        return await this.userDao.getUser(userId)
    }

    async createUser(request: RegisterRequest): Promise<User> {
        const user = new User(request)
        user.emailConfirmed = true
        user.onboardingCompleted = false
        return await this.userDao.createUser(user)
    }

    async searchUsers(request: SearchRequest): Promise<SearchResponse> {
        // There should only be one user with a confirmed email or phone
        if (request.email) {
            const user = await this.userDao.getUserByEmail(request.email)
            return new SearchResponse(user ? [user] : [], user ? 1 : 0)
        } else if (request.phoneNumber) {
            const user = await this.userDao.getUserByPhone(request.phoneNumber)
            return new SearchResponse(user ? [user] : [], user ? 1 : 0)
        }

        const [users, userCount] = await Promise.all([
            this.userDao.searchUsers(request.name, request.skip, request.limit),
            this.userDao.searchUserCount(request.name)
        ])

        const slimUsers = users.map(u => new SlimUser(u))
        return new SearchResponse(slimUsers, userCount)
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
        existingUser.birthday = request.birthday ? request.birthday : existingUser.birthday
        existingUser.onboardingCompleted = request.onboardingCompleted ? request.onboardingCompleted : existingUser.onboardingCompleted
        existingUser.address = request.address ? new Address(request.address) : existingUser.address
        existingUser.permissionGroups = request.permissionGroups ?
            request.permissionGroups.map((pg: object) => new PermissionGroup({...pg})) :
            existingUser.permissionGroups

        return await this.userDao.updateUser(existingUser)
    }

    async updateUserContact(existingUser: User, request: UpdateContactRequest): Promise<User> {
        // TODO - validate this new email or phone number doesn't already exist
        existingUser.email = request.email ? request.email : existingUser.email
        existingUser.emailConfirmed = request.emailConfirmed !== undefined ? request.emailConfirmed : existingUser.emailConfirmed

        existingUser.phoneNumber = request.phoneNumber ? request.phoneNumber : existingUser.phoneNumber
        existingUser.phoneNumberConfirmed = request.phoneNumberConfirmed !== undefined ? request.phoneNumberConfirmed : existingUser.phoneNumberConfirmed

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

    async requestConnection(request: RequestConnectionRequest): Promise<ConnectionRequest> {
        const {requestingUserId, requestedUserId, permissionGroupName} = request

        if (requestingUserId === requestedUserId) {
            throw new InvalidRequestError("User cannot request themself for connection")
        }

        const requestingUser = await this.userDao.getUser(requestingUserId)
        if (!requestingUser) {
            throw new UserNotFoundError(requestingUserId)
        } else if (!requestingUser.firstName) {
            throw new InvalidRequestError("Need first name of user before requesting connection")
        }

        const requestedUser = await this.getUser(requestedUserId)
        if (!requestedUser) {
            throw new UserNotFoundError(requestedUserId)
        }

        // if an existing request exists in any state then do nothing
        // PENDING - one already exists, don't create another
        // REJECTED - requestedUserId already rejected this user, do nothing
        // APPROVED - these two are already connected
        let existingRequest = await this.connectionDao.getConnectionRequest(requestingUserId, requestedUserId)
        if (existingRequest) {
            throw new ConnectionRequestExistsError()
        }

        // check if requested user has also requested the requesting user (treat as a confirm)
        existingRequest = await this.connectionDao.getConnectionRequest(requestedUserId, requestingUserId)
        // already connected!
        if (existingRequest && existingRequest.status === RequestStatus.APPROVED) {
            console.log("User being requested is already connected.")
            throw new AlreadyConnectedError()
        } else if (existingRequest) {
            // even if previous request was a rejection, a request by the "rejector" can be treated as approving
            // the original request that they previously rejected
            console.log("Another non-approved request exists between users. Treating as confirmation.")
            const confirmRequest = new ConfirmConnectionRequest(requestedUserId, requestingUserId, permissionGroupName)
            return await this.confirmConnection(confirmRequest)
        }

        const requestText = `${requestingUser.firstName} would like to connect!`
        return await this.connectionDao.createConnectionRequest(requestingUserId, requestedUserId, requestingUser.profileImage, requestText, permissionGroupName)
    }

    async confirmConnection(request: ConfirmConnectionRequest): Promise<ConnectionRequest> {
        const {requestingUserId, requestedUserId, permissionGroupName} = request

        // validate that connection request exists between users
        const existingRequest = await this.connectionDao.getConnectionRequest(requestingUserId, requestedUserId)
        if (!existingRequest) {
            throw new ConnectionRequestDoesNotExistError()
        }

        if (existingRequest.status === RequestStatus.APPROVED) {
            throw new InvalidRequestError("Request already approved")
        }

        // mark connection request as confirmed and create connections
        existingRequest.status = RequestStatus.APPROVED
        await Promise.all([
            this.connectionDao.updateConnectionRequest(existingRequest),
            this.connectionDao.createConnection(requestingUserId, requestedUserId, existingRequest.requestingPermissionGroupName),
            this.connectionDao.createConnection(requestedUserId, requestingUserId, permissionGroupName)
        ])

        return existingRequest
    }

    async denyConnection(request: DenyConnectionRequest): Promise<ConnectionRequest> {
        const requestedUserId = request.userId
        const requestingUserId = request.otherUserId

        // validate that connection request exists between users
        const existingRequest = await this.connectionDao.getConnectionRequest(requestingUserId, requestedUserId)
        if (!existingRequest) {
            throw new ConnectionRequestDoesNotExistError()
        }

        if (existingRequest.status !== RequestStatus.PENDING) {
            throw new InvalidRequestError("Request not in a pending state")
        }

        // mark connection request as confirmed and create connections
        existingRequest.status = RequestStatus.REJECTED

        await this.connectionDao.updateConnectionRequest(existingRequest)
        return existingRequest
    }

    async getPendingConnections(userId: string): Promise<ConnectionRequest[]> {
        return await this.connectionDao.getConnectionRequests(userId, RequestStatus.PENDING)
    }

    async getRejectedConnections(userId: string): Promise<SlimUser[]> {
        // Get the users that requested `userId` but `userId` rejected
        return await this.connectionDao.getRejectedUsers(userId)
    }

    async getConnections(request: SearchConnectionsRequest): Promise<SearchResponse> {
        const {userId, name, limit, skip} = request
        return await this.connectionDao.getConnections(userId, name, limit, skip)
    }

    async getConnection(userId: string, otherUserId: string): Promise<UserConnectionResponse> {
        // get the reverse connection so that we know what permission group we belong to
        const connection = await this.connectionDao.getConnection(otherUserId, userId)
        if (!connection) {
            throw new ConnectionDoesNotExistError()
        }

        const user = await this.getUser(otherUserId)
        if (!user) {
            throw new UserNotFoundError(otherUserId)
        }

        const permissionGroup = user.permissionGroups.find(pg => pg.name === connection.permissionGroupName)

        // No permission group details exist... return all (shouldn't happen)
        if (!permissionGroup || connection.permissionGroupName === "ALL") {
            console.log(`No permission group found with name ${connection.permissionGroupName} for user ${user.id}`)
            return user
        }

        // Filter attributes down to only the ones specified in the permission group
        const userObj = user.toPlainObj()
        let body = {}
        permissionGroup.getFields().forEach(field => {
            // @ts-ignore
            body[field] = userObj[field]
        })

        return new UserConnectionResponse(body)
    }
}

export {UserService}