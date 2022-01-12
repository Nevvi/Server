'use strict'

import {NotificationDao} from '../dao/NotificationDao';
import {fromDocument, newNotificationGroup, NotificationGroup} from "../model/NotificationGroup";
import {CreateGroupRequest} from "../model/request/CreateGroupRequest";

class NotificationService {
    private notificationDao: NotificationDao;
    constructor() {
        this.notificationDao = new NotificationDao()
    }

    async getNotificationGroup(userId: string, groupId: string): Promise<NotificationGroup> {
        const response = await this.notificationDao.getNotificationGroup(userId, groupId)
        return fromDocument(response)
    }

    async getNotificationGroups(userId: string): Promise<NotificationGroup[]> {
        const response = await this.notificationDao.getNotificationGroups(userId)
        return response.map(doc => fromDocument(doc))
    }

    async createNotificationGroup(createGroupRequest: CreateGroupRequest): Promise<NotificationGroup> {
        const notificationGroup = newNotificationGroup(createGroupRequest.userId, createGroupRequest.name)
        const response = await this.notificationDao.createNotificationGroup(notificationGroup)
        return fromDocument(response)
    }
}

export {NotificationService}