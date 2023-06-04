'use strict'

class SlimUser {
    id: any;
    firstName: any;
    lastName: any;
    profileImage: string;

    // We reuse this model for connection and user searches which causes some fields that only
    // exist in one scenario or the other
    connected: boolean;
    requested: boolean;
    inSync: boolean;

    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, profileImage, connected, requested, inSync} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.connected = connected === true
        this.requested = requested === true
        this.inSync = inSync === true
    }
}

export {SlimUser}