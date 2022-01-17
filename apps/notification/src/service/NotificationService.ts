'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {Command, UserResponse} from "../model/UserResponse";
import {UserDao} from "../dao/UserDao";
import {NotificationSender} from "../dao/NotificationSender";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";

const FILTERED_COMMANDS = [Command.HELP, Command.STOP, Command.UNSTOP]

class NotificationService {
    private userDao: UserDao;
    private notificationDao: NotificationDao;
    private notificationSender: NotificationSender;
    constructor() {
        this.userDao = new UserDao()
        this.notificationDao = new NotificationDao()
        this.notificationSender = new NotificationSender()
    }

    async getNotificationGroup(userId: string, groupId: string): Promise<NotificationGroup> {
        const response = await this.notificationDao.getNotificationGroup(userId, groupId)
        return fromDocument(response)
    }

    async getNotificationGroupByCode(groupCode: number): Promise<NotificationGroup> {
        const response = await this.notificationDao.getNotificationGroupByCode(groupCode)
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
        const topic = await this.notificationSender.createTopic(notificationGroup.id, notificationGroup.name)
        notificationGroup.topicArn = topic.TopicArn
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
            await this.subscribeUserGroup(response.originatingNumber, response.getGroupCode()!)
        } else if (command === Command.UNSUBSCRIBE) {
            console.log("UNSUBSCRIBING")
        }
    }

    async listUserGroups(phoneNumber: string) {
        const user = await this.userDao.getUserByPhone(phoneNumber)
        if (!user) {
            await this.notificationSender.sendMessage(phoneNumber, "Could not find a matching user for this phone number")
            return
        }

        const groups = await this.getNotificationGroups(user.userId)
        if (groups.length === 0){
            await this.notificationSender.sendMessage(phoneNumber, "No groups have been created yet for this user")
            return
        }

        const message = groups.map(group => `${group.referenceCode}: ${group.name}`).join("\n")
        await this.notificationSender.sendMessage(phoneNumber, message)
    }

    async subscribeUserGroup(phoneNumber: string, groupCode: number) {
        const group = await this.getNotificationGroupByCode(groupCode)
        // TODO - check if already subscribed
        const response = await this.notificationSender.createSubscription(group.topicArn!, phoneNumber)
        const subscriber = new NotificationGroupSubscriber(group.userId, group.id, group.referenceCode, response.SubscriptionArn!, phoneNumber, new Date().toISOString())
        await this.notificationDao.createNotificationGroupSubscriber(subscriber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully subscribed to ${group.name}\n\nReply UNSUBSCRIBE ${group.referenceCode} to stop receiving messages.`)
    }
}

export {NotificationService}