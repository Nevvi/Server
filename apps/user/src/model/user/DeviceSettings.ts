'use strict'

class DeviceSettings {
    autoSync: boolean

    constructor(body: object) {
        // @ts-ignore
        const {autoSync} = body;

        // data fields
        this.autoSync = autoSync === true
    }
}

export {DeviceSettings}