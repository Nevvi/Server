'use strict'

class User {
    firstName: any;
    lastName: any;
    email: string;
    phoneNumber: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {phoneNumber, createDate, lastName, email, firstName, updateDate, updateBy, createBy} = body;
        
        // data fields
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.phoneNumber = phoneNumber

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {User}