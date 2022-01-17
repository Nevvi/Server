'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {Command, UserResponse} from "../model/UserResponse";
import {UserDao} from "../dao/UserDao";

const FILTERED_COMMANDS = [Command.HELP, Command.STOP, Command.UNSTOP]

class NotificationService {
    private userDao: UserDao;
    private notificationDao: NotificationDao;
    constructor() {
        this.userDao = new UserDao()
        this.notificationDao = new NotificationDao()
    }

    async getNotificationGroup(userId: string, groupId: string): Promise<NotificationGroup> {
        const response = await this.notificationDao.getNotificationGroup(userId, groupId)
        return fromDocument(response)
    }

    async getNotificationGroups(userId: string): Promise<NotificationGroup[]> {
        const response = await this.notificationDao.getNotificationGroups(userId)
        return response
            .map(doc => fromDocument(doc))
            .sort((g1, g2) => g1.createDate.localeCompare(g2.createDate))
    }

    async createNotificationGroup(createGroupRequest: CreateGroupRequest): Promise<NotificationGroup> {
        const notificationGroup = newNotificationGroup(createGroupRequest.userId, createGroupRequest.name)
        const response = await this.notificationDao.createNotificationGroup(notificationGroup)
        return fromDocument(response)
    }

    async handleUserResponse(response: UserResponse) {
        const command = response.getCommand()

        // AWS handles these.. we don't need to intervene
        if (FILTERED_COMMANDS.includes(command) || command === Command.UNKNOWN) return

        if (command === Command.LIST) {
            await this.listUserGroups(response.originatingNumber)
        } else if (command === Command.SEND) {
            console.log("SENDING")
        } else if (command === Command.SUBSCRIBE) {
            console.log("SUBSCRIBING")
        } else if (command === Command.UNSUBSCRIBE) {
            console.log("UNSUBSCRIBING")
        }
    }

    async listUserGroups(phoneNumber: string) {
        const user = await this.userDao.getUserByPhone(phoneNumber)
        if (!user) {
            await this.userDao.sendMessage(phoneNumber, "Could not find a matching user for this phone number")
            return
        }

        const groups = await this.getNotificationGroups(user.userId)
        if (groups.length === 0){
            await this.userDao.sendMessage(phoneNumber, "No groups have been created yet for this user")
            return
        }

        const message = groups.map(group => `${group.referenceCode}: ${group.name}`).join("\n")
        await this.userDao.sendMessage(phoneNumber, message)
    }
}

export {NotificationService}