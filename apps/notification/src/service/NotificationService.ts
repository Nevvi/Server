'use strict'

import {Device} from '../model/Device';
import {DeviceDao} from "../dao/DeviceDao";
import {UpdateTokenRequest} from "../model/request/UpdateTokenRequest";
import {NotificationDao} from "../dao/NotificationDao";
import {DeviceDoesNotExistError} from "../error/Errors";

class NotificationService {
    private deviceDao: DeviceDao;
    private notificationDao: NotificationDao;

    constructor() {
        this.deviceDao = new DeviceDao()
        this.notificationDao = new NotificationDao()
    }

    async getDevice(userId: string): Promise<Device | null> {
        return await this.deviceDao.getDevice(userId)
    }

    async updateToken(request: UpdateTokenRequest) {
        const {userId, token} = request
        const existingDevice = await this.getDevice(userId)
        if (existingDevice) {
            await this.deviceDao.updateDeviceToken(userId, token)
        } else {
            await this.deviceDao.addDevice(userId, token)
        }
    }

    async sendNotification(userId: string, title: string, body: string) {
        const device = await this.getDevice(userId)
        if (!device) {
            throw new DeviceDoesNotExistError(userId)
        }

        await this.notificationDao.sendNotification(device.token, title, body)
    }
}

export {NotificationService}