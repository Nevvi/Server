'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {Command, UserResponse} from "../model/UserResponse";
import {UserDao} from "../dao/UserDao";
import {NotificationSender} from "../dao/NotificationSender";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {newNotification} from "../model/Notification";
import {NotificationGroupDoesNotExistError} from "../error/Errors";

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
        const document = await this.notificationDao.getNotificationGroup(userId, groupId)
        return fromDocument(document)
    }

    async getNotificationGroupInfo(userId: string, groupId: string): Promise<NotificationGroup> {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        if (group.userId !== userId) {
            throw new NotificationGroupDoesNotExistError(groupId)
        }

        return group
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
            await this.getGroupInfo(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.DELETE) {
            await this.deleteUserGroup(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.SEND) {
            await this.broadcastMessage(response.originatingNumber, response.getGroupId()!, response.getMessageText()!)
        } else if (command === Command.SUBSCRIBE) {
            await this.subscribeUserGroup(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.UNSUBSCRIBE) {
            await this.unSubscribeUserGroup(response.originatingNumber, response.getGroupId()!)
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

        const message = groups.map(group => `${group.id}: ${group.name}`).join("\n")
        await this.notificationSender.sendMessage(phoneNumber, message)
    }

    async getGroupInfo(phoneNumber: string, groupId: string) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupInfo(groupId)
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

    async deleteUserGroup(phoneNumber: string, groupId: string) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupInfo(groupId)
        ])
        if (!user || user.userId !== group.userId) {
            await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to delete this group")
            return
        }

        await this.notificationSender.deleteTopic(group.topicArn!)
        // TODO - disable group in dynamo
    }

    async broadcastMessage(phoneNumber: string, groupId: string, message: string) {
        // get user by phone number and get group by group code
        const [user, group] = await Promise.all([
            this.userDao.getUserByPhone(phoneNumber),
            this.notificationDao.getNotificationGroupInfo(groupId)
        ])
        if (user.userId !== group.userId) {
            await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to send messages to this group")
            return
        }

        // publish message to the topic in the group and store it in dynamo
        await this.sendMessage(group, message);

        await this.notificationSender.sendMessage(phoneNumber, `Successfully sent message to ${group.name}`)
    }

    public async sendMessage(group: NotificationGroup, message: string) {
        const notification = newNotification(group, message)
        await this.notificationSender.broadcastMessage(group.topicArn!, message)
        await this.notificationDao.createNotification(notification)
    }

    async subscribeUserGroup(phoneNumber: string, groupId: string) {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        if (group.subscribers.find((s: NotificationGroupSubscriber) => s.phoneNumber === phoneNumber)) {
            await this.notificationSender.sendMessage(phoneNumber, `You are already subscribed to messages for this group`)
            return
        }

        const response = await this.notificationSender.createSubscription(group.topicArn!, phoneNumber)
        const subscriber = new NotificationGroupSubscriber(group.userId, group.id, response.SubscriptionArn!, phoneNumber, new Date().toISOString())
        await this.notificationDao.createNotificationGroupSubscriber(subscriber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully subscribed to ${group.name}\n\nReply UNSUBSCRIBE ${group.id} to stop receiving messages.`)
    }

    async unSubscribeUserGroup(phoneNumber: string, groupId: string) {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        const subscriber = group.subscribers.find((s: NotificationGroupSubscriber) => s.phoneNumber === phoneNumber)
        if (!subscriber) {
            await this.notificationSender.sendMessage(phoneNumber, `You are already unsubscribed to this group`)
            return
        }

        await this.notificationSender.deleteSubscription(subscriber.subscriberArn)
        await this.notificationDao.deleteNotificationGroupSubscriber(group.userId, group.id, phoneNumber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully unsubscribed to ${group.name}\n\nReply SUBSCRIBE ${group.id} to receive messages again.`)
    }
}

export {NotificationService}