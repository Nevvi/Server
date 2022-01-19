'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {Command, UserResponse} from "../model/UserResponse";
import {UserDao} from "../dao/UserDao";
import {NotificationSender} from "../dao/NotificationSender";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {newNotification} from "../model/Notification";

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
        // get the group using the user id first to ensure the user owns the group
        const response = await this.notificationDao.getNotificationGroup(userId, groupId)
        // call back to get ALL the group info using the reference code
        return await this.notificationDao.getNotificationGroupInfo(response.referenceCode)
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
        console.log(`Processing a ${command} command from ${response.originatingNumber}`)

        if (command === Command.HELP) {
            await this.sendHelpMessage(response.originatingNumber)
        } else if (command === Command.LIST) {
            await this.listUserGroups(response.originatingNumber)
        } else if (command === Command.INFO) {
            await this.getGroupInfo(response.originatingNumber, response.getGroupCode()!)
        } else if (command === Command.DELETE) {
            await this.deleteUserGroup(response.originatingNumber, response.getGroupCode()!)
        } else if (command === Command.SEND) {
            await this.broadcastMessage(response.originatingNumber, response.getGroupCode()!, response.getMessageText()!)
        } else if (command === Command.SUBSCRIBE) {
            await this.subscribeUserGroup(response.originatingNumber, response.getGroupCode()!)
        } else if (command === Command.UNSUBSCRIBE) {
            await this.unSubscribeUserGroup(response.originatingNumber, response.getGroupCode()!)
        }
    }

    async sendHelpMessage(phoneNumber: string) {
        const message = "LIST to list the groups you are an owner of.\n" +
            "INFO ### to get group info if you are the owner.\n" +
            "DELETE ### to delete a group you own.\n" +
            "SEND ### to send a message to a group if you are the owner.\n" +
            "SUBSCRIBE ### to subscribe to group messages.\n" +
            "UNSUBSCRIBE ### to stop getting messages for a group."

        await this.notificationSender.sendMessage(phoneNumber, message)
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

    async getGroupInfo(phoneNumber: string, groupCode: number) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupInfo(groupCode)
        ])
        if (!user || user.userId !== group.userId) {
            await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to view info for this group")
            return
        }

        const numSubscribers = group.subscribers.length
        const numMessages = group.messages.length
        const message = `Subscribed to this group: ${numSubscribers}\n` +
            `Messages sent: ${numMessages}`;

        await this.notificationSender.sendMessage(phoneNumber, message)
    }

    async deleteUserGroup(phoneNumber: string, groupCode: number) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupByCode(groupCode)
        ])
        if (!user || user.userId !== group.userId) {
            await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to delete this group")
            return
        }

        await this.notificationSender.deleteTopic(group.topicArn)
        // TODO - disable group in dynamo
    }

    async broadcastMessage(phoneNumber: string, groupCode: number, message: string) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupByCode(groupCode)
        ])
        if (user.userId !== group.userId) {
            await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to send messages to this group")
            return
        }

        // publish message to the topic in the group and store it in dynamo
        const notification = newNotification(fromDocument(group), message)
        await this.notificationSender.broadcastMessage(group.topicArn, message)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully sent message to ${group.name}`)
        await this.notificationDao.createNotification(notification)
    }

    async subscribeUserGroup(phoneNumber: string, groupCode: number) {
        const group = await this.getNotificationGroupByCode(groupCode)

        try {
            await this.notificationDao.getNotificationGroupSubscriber(group.userId, group.id, phoneNumber)
            await this.notificationSender.sendMessage(phoneNumber, `You are already subscribed to messages for this group`)
        } catch (e: any) {
            // If 404 that means subscriber doesn't exist
            if (e.statusCode !== 404) throw e
        }

        const response = await this.notificationSender.createSubscription(group.topicArn!, phoneNumber)
        const subscriber = new NotificationGroupSubscriber(group.userId, group.id, group.referenceCode, response.SubscriptionArn!, phoneNumber, new Date().toISOString())
        await this.notificationDao.createNotificationGroupSubscriber(subscriber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully subscribed to ${group.name}\n\nReply UNSUBSCRIBE ${group.referenceCode} to stop receiving messages.`)
    }

    async unSubscribeUserGroup(phoneNumber: string, groupCode: number) {
        const group = await this.getNotificationGroupByCode(groupCode)

        try {
            const subscriber = await this.notificationDao.getNotificationGroupSubscriber(group.userId, group.id, phoneNumber)
            await this.notificationSender.deleteSubscription(subscriber.subscriberArn)
            await this.notificationDao.deleteNotificationGroupSubscriber(group.userId, group.id, phoneNumber)
            await this.notificationSender.sendMessage(phoneNumber, `Successfully unsubscribed to ${group.name}\n\nReply SUBSCRIBE ${group.referenceCode} to receive messages again.`)
        } catch (e: any) {
            if (e.statusCode === 404) {
                await this.notificationSender.sendMessage(phoneNumber, `You are already unsubscribed to this group`)
            } else {
                throw e
            }
        }
    }
}

export {NotificationService}