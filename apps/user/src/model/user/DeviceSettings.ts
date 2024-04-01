'use strict'

class DeviceSettings {
    autoSync: boolean
    notifyOutOfSync: boolean
    notifyBirthdays: boolean

    constructor(body: object) {
        // @ts-ignore
        const {autoSync, notifyOutOfSync, notifyBirthdays} = body;

        // data fields
        this.autoSync = autoSync === true

        // default to true initially unless explicitly turned off
        this.notifyOutOfSync = notifyOutOfSync == undefined || notifyOutOfSync === true
        this.notifyBirthdays = notifyBirthdays == undefined || notifyBirthdays === true
    }
}

export {DeviceSettings}