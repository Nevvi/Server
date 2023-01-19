'use strict'

class DeviceSettings {
    autoSync: boolean
    syncAllInformation: boolean
    constructor(body: object) {
        // @ts-ignore
        const {autoSync, syncAllInformation} = body;

        // data fields
        this.autoSync = autoSync === true
        this.syncAllInformation = syncAllInformation === true
    }
}

export {DeviceSettings}