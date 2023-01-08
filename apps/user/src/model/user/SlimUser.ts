'use strict'

class SlimUser {
    id: any;
    firstName: any;
    lastName: any;
    profileImage: string;
    connected: boolean;
    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, profileImage, connected} = body;

        // data fields
        this.id = id
        this.firstName = firstName
        this.lastName = lastName
        this.profileImage = profileImage ? profileImage : process.env.DEFAULT_PROFILE_IMAGE
        this.connected = connected === true
    }
}

export {SlimUser}