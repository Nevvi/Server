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
    ConnectionRequestExistsError, GroupDoesNotExistError,
    InvalidRequestError, UserAlreadyInGroupError,
    UserNotFoundError, UserNotInGroupError
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
import {UpdateConnectionRequest} from "../model/request/UpdateConnectionRequest";
import {BlockConnectionRequest} from "../model/request/BlockConnectionRequest";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {ConnectionGroup} from "../model/connection/ConnectionGroup";
import {ConnectionGroupDao} from "../dao/ConnectionGroupDao";
import {AddConnectionToGroupRequest} from "../model/request/AddConnectionToGroupRequest";
import {RemoveConnectionFromGroupRequest} from "../model/request/RemoveConnectionFromGroupRequest";
import {ExportService} from "./ExportService";
import {SearchGroupsRequest} from "../model/request/SearchGroupsRequest";
import {NotificationDao} from "../dao/NotificationDao";
import {DeviceSettings} from "../model/user/DeviceSettings";
import {int} from "aws-sdk/clients/datapipeline";
import {SuggestionService} from "./SuggestionService";
import {DeleteRequest} from "aws-sdk/clients/dynamodb";
import {DEFAULT_ALL_PERMISSION_GROUP_NAME} from "../model/Constants";

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

function formatPhoneNumber(phoneNumber: string): string {
    const phoneNumberParsed = phoneUtil.parseAndKeepRawInput(phoneNumber, 'US');

    if (!phoneUtil.isValidNumberForRegion(phoneNumberParsed, 'US')) {
        throw new InvalidRequestError('Invalid phone number format')
    }
    return phoneUtil.format(phoneNumberParsed, PNF.E164);
}

function chunk(arr: any[], size: int): any[][] {
    return Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

function areSetsEqual(a: any, b: any): boolean {
    return a.size === b.size && [...a].every(value => b.has(value));
}


class UserService {
    private userDao: UserDao;
    private imageDao: ImageDao;
    private connectionDao: ConnectionDao;
    private connectionGroupDao: ConnectionGroupDao;
    private suggestionsService: SuggestionService;
    private authenticationDao: AuthenticationDao;
    private exportService: ExportService
    private notificationDao: NotificationDao

    constructor() {
        this.userDao = new UserDao()
        this.authenticationDao = new AuthenticationDao()
        this.imageDao = new ImageDao()
        this.connectionDao = new ConnectionDao()
        this.connectionGroupDao = new ConnectionGroupDao()
        this.suggestionsService = new SuggestionService()
        this.exportService = new ExportService()
        this.notificationDao = new NotificationDao()
    }

    async getUser(userId: string): Promise<User | null> {
        return await this.userDao.getUser(userId)
    }

    async createUser(request: RegisterRequest): Promise<User> {
        const user = new User(request)
        user.phoneNumberConfirmed = true
        user.onboardingCompleted = false
        return await this.userDao.createUser(user)
    }

    async deleteUser(request: DeleteRequest): Promise<User> {
        const user = new User(request)
        user.phoneNumberConfirmed = true
        user.onboardingCompleted = false
        return await this.userDao.createUser(user)
    }

    async searchUsers(userId: string, request: SearchRequest): Promise<SearchResponse> {
        // There should only be one user with a confirmed email or phone
        if (request.email) {
            const user = await this.userDao.getUserByEmail(request.email)
            return new SearchResponse(user ? [new SlimUser(user)] : [], user ? 1 : 0)
        } else if (request.phoneNumber) {
            const user = await this.userDao.getUserByPhone(request.phoneNumber)
            return new SearchResponse(user ? [new SlimUser(user)] : [], user ? 1 : 0)
        }

        let users: SlimUser[] = []
        let userCount: number = 0

        if (request.phoneNumbers) {
            // @ts-ignore
            const formattedNumbers: string[] = request.phoneNumbers ?
                request.phoneNumbers.map(number => {
                    try {
                        return formatPhoneNumber(number)
                    } catch (err) {
                        return undefined
                    }
                }).filter(num => num !== undefined) :
                []

            // this could be a ton of numbers, chunk out the calls to avoid a massive db call
            const phoneNumberChunks: string[][] = chunk(formattedNumbers, 40)
            const chunkResults: [SlimUser[], number][] = await Promise.all(phoneNumberChunks.map(chunk => {
                return Promise.all([
                    this.userDao.searchUsers(userId, request.name, chunk, request.skip, request.limit),
                    this.userDao.searchUserCount(userId, request.name, chunk)
                ])
            }))

            chunkResults.forEach(([chunkUsers, chunkCount]) => {
                users.push(...chunkUsers)
                userCount = userCount + chunkCount
            })
        } else {
            users = await this.userDao.searchUsers(userId, request.name, [], request.skip, request.limit)
            userCount = await this.userDao.searchUserCount(userId, request.name, [])
        }

        return new SearchResponse(users, userCount)
    }

    async updateUser(existingUser: User, request: UpdateRequest): Promise<User> {
        const updatedUser = new User(JSON.parse(JSON.stringify(existingUser)))

        // Need to send new email over to auth service to get confirmed
        // once confirmed it will call back here so that we can keep track that it was confirmed
        if (request.email && existingUser.email !== request.email) {
            // TODO - also validate that email isn't already being used and confirmed in the user data store
            console.log("Updating user email", request.email)
            const updatedAuthUser = await this.authenticationDao.updateUser(existingUser.id, request.email)
            // If the update resulted in a change in email then mark this value as false
            if (updatedAuthUser.emailVerified !== true) {
                updatedUser.emailConfirmed = false
            }
        }

        // TODO - make this a little more dynamic
        updatedUser.firstName = request.firstName ? request.firstName : updatedUser.firstName
        updatedUser.lastName = request.lastName ? request.lastName : updatedUser.lastName
        updatedUser.bio = request.bio ? request.bio : updatedUser.bio
        updatedUser.email = request.email ? request.email : updatedUser.email
        updatedUser.birthday = request.birthday ? request.birthday : updatedUser.birthday
        updatedUser.onboardingCompleted = request.onboardingCompleted ? request.onboardingCompleted : updatedUser.onboardingCompleted
        updatedUser.deviceId = request.deviceId ? request.deviceId : updatedUser.deviceId
        updatedUser.address = request.address ? new Address(request.address) : updatedUser.address
        updatedUser.mailingAddress = request.mailingAddress ? new Address(request.mailingAddress) : updatedUser.mailingAddress
        updatedUser.deviceSettings = request.deviceSettings ? new DeviceSettings(request.deviceSettings) : updatedUser.deviceSettings
        updatedUser.permissionGroups = request.permissionGroups ?
            request.permissionGroups.map((pg: object) => new PermissionGroup({...pg})) :
            updatedUser.permissionGroups

        const updatedPermissionGroups = new Set(updatedUser.permissionGroups.map(pg => pg.name))
        const removedPermissionGroups = existingUser.permissionGroups.filter(pg => !updatedPermissionGroups.has(pg.name))
        for (const permissionGroup of removedPermissionGroups) {
            if (permissionGroup.name == DEFAULT_ALL_PERMISSION_GROUP_NAME) {
                throw new InvalidRequestError(`Cannot delete the default ALL group`)
            }

            const connectionsExist = await this.connectionDao.permissionGroupConnectionsExist(updatedUser.id, permissionGroup.name)
            if (connectionsExist) {
                throw new InvalidRequestError(`Cannot delete permission group ${permissionGroup.name} while there are existing connections`)
            }
        }

        if (updatedUser.didConnectionDataChange(existingUser)) {
            console.log("User changed!")
            const [user, markedConnections] = await Promise.all([
                this.userDao.updateUser(updatedUser),
                this.connectionDao.markConnections(updatedUser.id)
            ])
            console.log(`Marked ${markedConnections} as out of sync`)
            return user
        } else {
            return await this.userDao.updateUser(updatedUser)
        }
    }

    async updateUserContact(existingUser: User, request: UpdateContactRequest): Promise<User> {
        // TODO - validate this new email or phone number doesn't already exist
        existingUser.email = request.email ? request.email : existingUser.email
        existingUser.emailConfirmed = request.emailConfirmed !== undefined ? request.emailConfirmed : existingUser.emailConfirmed

        return await this.userDao.updateUser(existingUser)
    }

    async updateUserImage(userId: string, image: Buffer, imageName: string, contentType: string): Promise<User> {
        const user = await this.getUser(userId)
        if (!user) {
            throw new UserNotFoundError(userId)
        }

        user.profileImage = await this.imageDao.uploadImage(userId, image, imageName, contentType)
        const updatedUser = await this.userDao.updateUser(user)
        await this.imageDao.removeOldImages(userId, imageName)
        return updatedUser
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

        // If the requested user blocked this user then send back a generic error message
        if (requestedUser.blockedUsers.includes(requestingUserId)) {
            throw new ConnectionRequestExistsError()
        }

        // If this user previous blocked that user we need to remove them from the list of blocked users
        // and any previously rejected requests
        if (requestingUser.blockedUsers.includes(requestedUserId)) {
            requestingUser.removeBlockedUser(requestedUserId)
            await Promise.all([
                this.userDao.updateUser(requestingUser),
                this.connectionDao.deleteConnectionRequest(requestingUserId, requestedUserId)
            ])
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
        } else if (existingRequest && existingRequest.status === RequestStatus.PENDING) {
            console.log("Another pending request exists between users. Treating as confirmation.")
            const confirmRequest = new ConfirmConnectionRequest(requestedUserId, requestingUserId, permissionGroupName)
            return await this.confirmConnection(confirmRequest)
        }

        const requestText = `${requestingUser.firstName} would like to connect!`
        const newRequest = await this.connectionDao.createConnectionRequest(requestingUser,
            requestedUserId, permissionGroupName)

        // send notification and remove the requested user as a suggestion (if they were a suggestion)
        await Promise.all([
            this.notificationDao.sendNotification(requestedUserId, "Nevvi", requestText),
            this.suggestionsService.removeSuggestion(requestingUserId, requestedUserId)
        ])

        return newRequest
    }

    async confirmConnection(request: ConfirmConnectionRequest): Promise<ConnectionRequest> {
        const {requestingUserId, requestedUserId, permissionGroupName} = request

        // validate that connection request exists between users
        const existingRequest = await this.connectionDao.getConnectionRequest(requestingUserId, requestedUserId)
        if (!existingRequest) {
            throw new ConnectionRequestDoesNotExistError()
        }

        const [requestingUser, requestedUser] = await Promise.all([
            this.userDao.getUser(requestingUserId),
            this.userDao.getUser(requestedUserId),
        ])

        if (!requestingUser) {
            throw new UserNotFoundError(requestingUserId)
        } else if (!requestedUser) {
            throw new UserNotFoundError(requestedUserId)
        }

        if (existingRequest.status !== RequestStatus.PENDING) {
            throw new InvalidRequestError("Request not in a pending state")
        }

        // mark connection request as confirmed, create connections, send notification, and remove users as suggestions
        existingRequest.status = RequestStatus.APPROVED
        const requestText = `${requestedUser.firstName} accepted your request!`
        await Promise.all([
            this.connectionDao.updateConnectionRequest(existingRequest),
            this.connectionDao.createConnection(requestingUserId, requestedUserId, existingRequest.requestingPermissionGroupName),
            this.connectionDao.createConnection(requestedUserId, requestingUserId, permissionGroupName),
            this.notificationDao.sendNotification(requestingUserId, "Nevvi", requestText),
            this.suggestionsService.removeSuggestion(requestingUserId, requestedUserId),
            this.suggestionsService.removeSuggestion(requestedUserId, requestingUserId)
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

        // by denying a request it implicitly blocks that user
        const user = await this.userDao.getUser(request.userId)
        user!!.addBlockedUser(requestingUserId)

        // mark connection request as rejected, update blocked users, and remove users as suggestions
        await Promise.all([
            this.connectionDao.updateConnectionRequest(existingRequest),
            this.userDao.updateUser(user!!),
            this.suggestionsService.removeSuggestion(requestingUserId, requestedUserId),
            this.suggestionsService.removeSuggestion(requestedUserId, requestingUserId)
        ])

        return existingRequest
    }

    async getPendingConnections(userId: string): Promise<ConnectionRequest[]> {
        return await this.connectionDao.getConnectionRequests(userId, RequestStatus.PENDING)
    }

    async getBlockedUsers(userId: string): Promise<SlimUser[]> {
        return await this.userDao.getBlockedUsers(userId)
    }

    async getConnections(request: SearchConnectionsRequest): Promise<SearchResponse> {
        const {userId, name, permissionGroup, inSync, limit, skip} = request
        return await this.connectionDao.getConnections(userId, name, permissionGroup, inSync, limit, skip)
    }

    async getConnection(userId: string, otherUserId: string): Promise<UserConnectionResponse> {
        // get the reverse connection so that we know what permission group we belong to
        const [connectionToMe, connectionToThem] = await Promise.all([
            this.connectionDao.getConnection(otherUserId, userId),
            this.connectionDao.getConnection(userId, otherUserId)
        ])

        if (!connectionToMe || !connectionToThem) {
            throw new ConnectionDoesNotExistError()
        }

        const theirPermissionGroup = connectionToThem.permissionGroupName || DEFAULT_ALL_PERMISSION_GROUP_NAME

        const user = await this.getUser(otherUserId)
        if (!user) {
            throw new UserNotFoundError(otherUserId)
        }

        const permissionGroup = user.permissionGroups.find(pg => pg.name === connectionToMe.permissionGroupName)
        const userObj: any = user.toPlainObj()

        // No permission group details exist... return all (shouldn't happen)
        if (!permissionGroup || connectionToMe.permissionGroupName === DEFAULT_ALL_PERMISSION_GROUP_NAME) {
            if (!permissionGroup) {
                console.log(`No permission group found with name ${connectionToMe.permissionGroupName} for user ${user.id}`)
            }
            userObj["email"] = user.emailConfirmed ? user.email : null
            return new UserConnectionResponse(userObj, theirPermissionGroup)
        }

        // Filter attributes down to only the ones specified in the permission group
        let body = {}
        permissionGroup.getFields().forEach(field => {
            // only append the email if the user has confirmed it
            if (field !== "email" || (field === "email" && user.emailConfirmed)) {
                // @ts-ignore
                body[field] = userObj[field]
            }
        })

        // Return the permission group that user put other user in so they can update if they want
        return new UserConnectionResponse(body, theirPermissionGroup)
    }

    async updateConnection(request: UpdateConnectionRequest): Promise<UserConnectionResponse> {
        // TODO let's just do an update like we do for user
        const success = await this.connectionDao.updateConnection(request.userId, request.otherUserId, request.permissionGroupName, request.inSync)
        if (!success) {
            throw new ConnectionDoesNotExistError()
        }

        return await this.getConnection(request.userId, request.otherUserId)
    }

    async blockConnection(request: BlockConnectionRequest): Promise<boolean> {
        let connectionRequest = await this.connectionDao.getConnectionRequest(request.userId, request.otherUserId)
        if (!connectionRequest) {
            connectionRequest = await this.connectionDao.getConnectionRequest(request.otherUserId, request.userId)
        }
        if (!connectionRequest) {
            throw new ConnectionDoesNotExistError()
        }

        const user = await this.userDao.getUser(request.userId)
        user!!.addBlockedUser(request.otherUserId)

        // Delete the connections and connection requests, update the blocked users for this user
        // TODO Remove blocked user from any connection groups they might be in
        const [successOne, successTwo, successThree] = await Promise.all([
            this.connectionDao.deleteConnection(request.userId, request.otherUserId),
            this.connectionDao.deleteConnection(request.otherUserId, request.userId),
            this.connectionDao.deleteConnectionRequest(connectionRequest.requestingUserId, connectionRequest.requestedUserId),
            this.connectionDao.deleteConnectionRequest(connectionRequest.requestedUserId, connectionRequest.requestingUserId),
            this.userDao.updateUser(user!!)
        ])

        return successOne && successTwo && successThree
    }

    async createGroup(request: CreateGroupRequest): Promise<ConnectionGroup> {
        const groups = await this.getConnectionGroups(request.userId)
        if (groups.length > 10) {
            throw new InvalidRequestError("User cannot have more than 10 connection groups")
        }

        return await this.connectionGroupDao.createConnectionGroup(request.userId, request.name)
    }

    async getConnectionGroups(userId: string): Promise<ConnectionGroup[]> {
        return await this.connectionGroupDao.getConnectionGroups(userId)
    }

    async deleteConnectionGroup(userId: string, groupId: string): Promise<boolean> {
        return await this.connectionGroupDao.deleteConnectionGroup(userId, groupId)
    }

    async exportGroup(userId: string, groupId: string): Promise<boolean> {
        const [connections, group] = await Promise.all([
            this.getGroupConnections(userId, groupId),
            this.connectionGroupDao.getConnectionGroup(userId, groupId)
        ])

        if (!group) {
            throw new GroupDoesNotExistError(groupId)
        }
        if (!connections.length) {
            throw new InvalidRequestError("Cannot export an empty group")
        }

        console.log(`Exporting ${connections.length} connections for group ${group.name}`)

        const user = await this.getUser(userId)
        if (!user || !user.email || !user.emailConfirmed) {
            throw new InvalidRequestError("User must have a confirmed email address before exporting groups")
        }

        await this.exportService.sendExport(group.name, user!, connections)

        return true
    }

    async getGroupConnections(userId: string, groupId: string): Promise<UserConnectionResponse[]> {
        const group = await this.connectionGroupDao.getConnectionGroup(userId, groupId)

        // Make sure the group exists and the user is in the group
        if (!group) {
            throw new GroupDoesNotExistError(groupId)
        }

        let connections: UserConnectionResponse[] = []

        // Now get all the connection data... could take a bit
        const maxRunningTasks = 10
        for (let i = 0; i < group.connections.length; i += maxRunningTasks) {
            const connectionIdChunk = group.connections.slice(i, i + maxRunningTasks);
            const connectionsChunk = await Promise.all(connectionIdChunk.map(connectionId => {
                return this.getConnection(userId, connectionId)
            }))
            connections.push(...connectionsChunk)
        }

        return connections
    }

    async searchGroupConnections(groupId: string, request: SearchGroupsRequest): Promise<SearchResponse> {
        const {userId, name, limit, skip} = request
        return await this.connectionGroupDao.getConnections(userId, groupId, name, limit, skip)
    }

    async addConnectionToGroup(request: AddConnectionToGroupRequest): Promise<ConnectionGroup> {
        const [connection, group] = await Promise.all([
            this.getConnection(request.userId, request.connectedUserId),
            this.connectionGroupDao.getConnectionGroup(request.userId, request.groupId)
        ])

        // Make sure these users are even connected
        if (!connection) {
            throw new ConnectionDoesNotExistError()
        }

        // Also make sure the group exists and the user isn't already in the group
        if (!group) {
            throw new GroupDoesNotExistError(request.groupId)
        }
        if (group.connections.includes(request.connectedUserId)) {
            throw new UserAlreadyInGroupError()
        }
        if (group.connections.length > 200) {
            throw new InvalidRequestError("Group cannot exceed 200 connections")
        }

        const success = await this.connectionGroupDao.addUserToGroup(request.userId, request.groupId, request.connectedUserId)

        // instead of making another db call just add to the list manually and return
        if (success) {
            group.connections.push(request.connectedUserId)
        }

        return group
    }

    async removeConnectionFromGroup(request: RemoveConnectionFromGroupRequest): Promise<ConnectionGroup> {
        const group = await this.connectionGroupDao.getConnectionGroup(request.userId, request.groupId)

        // Make sure the group exists and the user is in the group
        if (!group) {
            throw new GroupDoesNotExistError(request.groupId)
        }
        if (!group.connections.includes(request.connectedUserId)) {
            throw new UserNotInGroupError()
        }

        const success = await this.connectionGroupDao.removeUserFromGroup(request.userId, request.groupId, request.connectedUserId)

        // instead of making another db call just remove from the list manually and return
        if (success) {
            group.connections = group.connections.filter(c => c !== request.connectedUserId)
        }

        return group
    }

    async notifyOutOfSyncUsers(): Promise<number> {
        let skip = 0
        let limit = 500
        let notified = 0
        let users = await this.connectionDao.getOutOfSyncUsers(skip, limit)

        while (users.length > 0) {
            // TODO - send this to SQS for further processing
            await Promise.all(users.map(async userId => {
                return this.notificationDao.sendNotification(userId, "You're connections are out of sync!", "Open the app to sync your device")
            }))

            notified = notified + users.length
            skip = skip + limit
            users = await this.connectionDao.getOutOfSyncUsers(skip, limit)
        }

        return notified
    }

    async notifyBirthdays(): Promise<number> {
        let notified = 0

        // Get people with a birthday today
        const easternTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
        const currentDate = new Date(easternTime)

        let users = await this.userDao.getUsersByBirthday(currentDate)

        // TODO - clean this up and check permission groups
        const chunks: User[][] = chunk(users, 40)
        await Promise.all(chunks.map(async userChunk => {
            return await Promise.all(userChunk.map(async user => {
                let connections = await this.connectionDao.getConnections(user.id, undefined, undefined, undefined, 100000, 0)
                console.log(`Sending notification to ${connections.count} connections for ${user.firstName} ${user.lastName}'s birthday`)
                const text = `It's ${user.firstName} ${user.lastName}'s birthday!`
                const body = `Wish them a happy birthday`
                return await Promise.all(connections.users.map(async connection => {
                    let connectionUser = await this.userDao.getUser(connection.id)
                    if (connectionUser?.deviceSettings.notifyBirthdays) {
                        notified += 1
                        console.log(`Notifying ${connection.id} about birthday for ${user.id}`)
                        return this.notificationDao.sendNotification(connection.id, text, body)
                    }
                }))
            }))
        }))

        return notified
    }
}

export {UserService}