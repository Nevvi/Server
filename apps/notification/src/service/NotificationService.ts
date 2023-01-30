'use strict'

import {Device} from '../model/Device';
import {NotificationDao} from "../dao/NotificationDao";
import {UpdateTokenRequest} from "../model/request/UpdateTokenRequest";

class NotificationService {
    private notificationDao: NotificationDao;

    constructor() {
        this.notificationDao = new NotificationDao()
    }

    async getDevice(userId: string): Promise<Device | null> {
        return await this.notificationDao.getDevice(userId)
    }

    async updateToken(request: UpdateTokenRequest) {
        const {userId, token} = request
        const existingDevice = await this.getDevice(userId)
        if (existingDevice) {
            await this.notificationDao.updateDeviceToken(userId, token)
        } else {
            await this.notificationDao.addDevice(userId, token)
        }
    }
}

export {NotificationService}