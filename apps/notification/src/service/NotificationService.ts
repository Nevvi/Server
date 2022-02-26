'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";
import {NotificationSender} from "../dao/NotificationSender";
import {NotificationGroupDoesNotExistError} from "../error/Errors";
import {newNotification} from "../model/Notification";

class NotificationService {
    protected notificationSender: NotificationSender;
    protected notificationDao: NotificationDao;

    constructor() {
        this.notificationSender = new NotificationSender();
        this.notificationDao = new NotificationDao();
    }

    public async sendMessage(group: NotificationGroup, message: string) {
        const notification = newNotification(group, message)
        await this.notificationSender.broadcastMessage(group.topicArn!, message)
        await this.notificationDao.createNotification(notification)
    }

    // returns group metadata
    async getNotificationGroup(userId: string, groupId: string): Promise<NotificationGroup> {
        const document = await this.notificationDao.getNotificationGroup(userId, groupId)
        return fromDocument(document)
    }

    // returns a fully populated groups with subscribers and messages
    async getNotificationGroupInfo(userId: string, groupId: string): Promise<NotificationGroup> {
        const group = await this.notificationDao.getNotificationGroupInfo(groupId)

        if (group.userId !== userId) {
            throw new NotificationGroupDoesNotExistError(groupId)
        }

        return group
    }

    // gets all group metadata for a user
    async getNotificationGroups(userId: string): Promise<NotificationGroup[]> {
        const response = await this.notificationDao.getNotificationGroups(userId)
        return response
            .map(doc => fromDocument(doc))
            .sort((g1, g2) => g1.createDate.localeCompare(g2.createDate))
    }

    async createNotificationGroup(createGroupRequest: CreateGroupRequest): Promise<NotificationGroup> {
        const notificationGroup = newNotificationGroup(createGroupRequest.userId, createGroupRequest.name, createGroupRequest.expirationDate)
        const topic = await this.notificationSender.createTopic(notificationGroup.id, notificationGroup.name)
        notificationGroup.topicArn = topic.TopicArn
        const response = await this.notificationDao.createNotificationGroup(notificationGroup)
        return fromDocument(response)
    }
}

export {NotificationService}