'use strict'

import {Command, UserResponse} from "../model/UserResponse";
import {UserDao} from "../dao/UserDao";
import {NotificationGroupSubscriber} from "../model/NotificationGroupSubscriber";
import {NotificationService} from "./NotificationService";
import {NotificationGroup} from "../model/NotificationGroup";
import {newNotificationAudit} from "../model/NotificationAudit";
import {AuditResult} from "../model/audit/AuditResult";

import dayjs from "dayjs";
import {RateLimitError} from "../error/Errors";

class UserResponseService extends NotificationService {
    private userDao: UserDao;
    constructor() {
        super()
        this.userDao = new UserDao()
    }

    async safeHandleUserResponse(response: UserResponse) {
        try {
            await this.handleUserResponse(response)
        } catch (e: any) {
            console.log("Failed to process request", response, e)
        }
    }

    async handleUserResponse(response: UserResponse) {
        const command = response.getCommand()
        console.log(`Processing a ${command} command from ${response.originatingNumber}`)
        await this.tryRateLimit(response.originatingNumber)

        let auditResult = AuditResult.SUCCESS
        if (command === Command.HELP) {
            auditResult = await this.sendHelpMessage(response.originatingNumber)
        } else if (command === Command.LIST) {
            auditResult = await this.listUserGroups(response.originatingNumber)
        } else if (command === Command.INFO) {
            auditResult = await this.getGroupInfo(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.DELETE) {
            auditResult = await this.deleteUserGroup(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.SEND) {
            auditResult = await this.broadcastMessage(response.originatingNumber, response.getGroupId()!, response.getMessageText()!)
        } else if (command === Command.SUBSCRIBE) {
            auditResult = await this.subscribeUserGroup(response.originatingNumber, response.getGroupId()!)
        } else if (command === Command.UNSUBSCRIBE) {
            auditResult = await this.unSubscribeUserGroup(response.originatingNumber, response.getGroupId()!)
        }

        const group: string = response.getGroupId() || "NONE"
        const message = response.getMessageText() || "NONE"
        const audit = newNotificationAudit(response.originatingNumber, command, group, message, auditResult)
        await this.notificationDao.createNotificationAudit(audit)
    }

    async tryRateLimit(phoneNumber: string) {
        const shortCutoff: string = dayjs().subtract(1, 'minute').toISOString()
        let previousRequests = await this.notificationDao.getNotificationAudits(phoneNumber, shortCutoff)
        if (previousRequests.length >= 5) {
            throw new RateLimitError(phoneNumber, 1)
        }

        // TODO check these rate limits without incurring costs of db lookups even if rate limited
        // TODO check for number of messages per hour?
        // TODO alert on frequent rate limits
    }

    async sendHelpMessage(phoneNumber: string): Promise<AuditResult> {
        const message = "LIST to list the groups you are an owner of.\n" +
            "INFO ### to get group info if you are the owner.\n" +
            "DELETE ### to delete a group you own.\n" +
            "SEND ### to send a message to a group if you are the owner.\n" +
            "SUBSCRIBE ### to subscribe to group messages.\n" +
            "UNSUBSCRIBE ### to stop getting messages for a group."

        await this.notificationSender.sendMessage(phoneNumber, message)
        return AuditResult.SUCCESS
    }

    async listUserGroups(phoneNumber: string): Promise<AuditResult> {
        const user = await this.userDao.getUserByPhone(phoneNumber)
        if (!user) {
            const message = "Could not find a matching user for this phone number. Create an account online to leverage these mobile commands."
            await this.notificationSender.sendMessage(phoneNumber, message)
            return AuditResult.NO_MATCHING_USER
        }

        const groups = await this.notificationDao.getNotificationGroups(user.userId)
        if (groups.length === 0){
            await this.notificationSender.sendMessage(phoneNumber, "No groups have been created yet for this user")
            return AuditResult.SUCCESS
        }

        const message = groups.map(group => `${group.id}: ${group.name}`).join("\n")
        await this.notificationSender.sendMessage(phoneNumber, message)
        return AuditResult.SUCCESS
    }

    async getGroupInfo(phoneNumber: string, groupId: string): Promise<AuditResult> {
        const group = await this.getUserGroup(phoneNumber, groupId)
        if (!group) {
            return AuditResult.NO_MATCHING_GROUP
        }

        const numSubscribers = group.subscribers.length
        const numMessages = group.messages.length
        const message = `Subscribed to this group: ${numSubscribers}\n` +
            `Messages sent: ${numMessages}\n` +
            `Status: ${group.status}`;

        await this.notificationSender.sendMessage(phoneNumber, message)
        return AuditResult.SUCCESS
    }

    async deleteUserGroup(phoneNumber: string, groupId: string): Promise<AuditResult> {
        const user = await this.userDao.getUserByPhone(phoneNumber)
        const success = await this.deleteNotificationGroup(user.userId, groupId)
        if (!success) {
            return AuditResult.NO_MATCHING_GROUP
        }
        await this.notificationSender.sendMessage(phoneNumber, `Successfully disabled group`)
        return AuditResult.SUCCESS
    }

    async broadcastMessage(phoneNumber: string, groupId: string, message: string): Promise<AuditResult> {
        const group = await this.getUserGroup(phoneNumber, groupId)
        if (!group || group.status === 'DISABLED') {
            return AuditResult.NO_MATCHING_GROUP
        }

        // publish message to the topic in the group and store it in dynamo
        await this.sendMessage(group, message);
        await this.notificationSender.sendMessage(phoneNumber, `Successfully sent message to ${group.name}`)
        return AuditResult.SUCCESS
    }

    async subscribeUserGroup(phoneNumber: string, groupId: string): Promise<AuditResult> {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        if (group.subscribers.find((s: NotificationGroupSubscriber) => s.phoneNumber === phoneNumber)) {
            await this.notificationSender.sendMessage(phoneNumber, `You are already subscribed to messages for this group`)
            return AuditResult.DUPLICATE
        }

        const response = await this.notificationSender.createSubscription(group.topicArn!, phoneNumber)
        const subscriber = new NotificationGroupSubscriber(group.userId, group.id, response.SubscriptionArn!, phoneNumber, new Date().toISOString())
        await this.notificationDao.createNotificationGroupSubscriber(subscriber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully subscribed to ${group.name}\n\nReply UNSUBSCRIBE ${group.id} to stop receiving messages.`)
        return AuditResult.SUCCESS
    }

    async unSubscribeUserGroup(phoneNumber: string, groupId: string): Promise<AuditResult> {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        const subscriber = group.subscribers.find((s: NotificationGroupSubscriber) => s.phoneNumber === phoneNumber)
        if (!subscriber) {
            await this.notificationSender.sendMessage(phoneNumber, `You are already unsubscribed to this group`)
            return AuditResult.DUPLICATE
        }

        await this.notificationSender.deleteSubscription(subscriber.subscriberArn)
        await this.notificationDao.deleteNotificationGroupSubscriber(group.userId, group.id, phoneNumber)
        await this.notificationSender.sendMessage(phoneNumber, `Successfully unsubscribed to ${group.name}\n\nReply SUBSCRIBE ${group.id} to receive messages again.`)
        return AuditResult.SUCCESS
    }

    private async getUserGroup(phoneNumber: string, groupId: string, sendMessage: boolean = true): Promise<NotificationGroup | undefined> {
        // get user by phone number and get group by group code
        try {
            const [user, group] = await Promise.all([
                this.userDao.getUserByPhone(phoneNumber),
                this.notificationDao.getNotificationGroupInfo(groupId)
            ])
            if (!user || user.userId !== group.userId) {
                if (sendMessage) {
                    await this.notificationSender.sendMessage(phoneNumber, "You are not allowed to perform this action on this group")
                }
                return
            }

            return group
        } catch (e) {
            console.log(`Could not retrieve group due to ${e}`)
            return
        }
    }
}

export {UserResponseService}