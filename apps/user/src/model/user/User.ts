'use strict'

class User {
    id: any;
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
        const {id, phoneNumber, createDate, lastName, email, firstName, updateDate, updateBy, createBy} = body;
        
        // data fields
        this.id = id
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