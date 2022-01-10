'use strict'

module.exports = class {
    partitionKey: string;
    sortKey: string;
    gsi1pk: string;
    gsi2pk: string;
    firstName: string;
    lastName: string;
    email: string;
    emailConfirmed: boolean;
    phoneNumber: string;
    phoneNumberConfirmed: boolean;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {id, firstName, lastName, phoneNumber, phoneNumberConfirmed, email, emailConfirmed, createDate, updateDate, updateBy, createBy} = body;

        // dynamodb fields
        this.partitionKey = id
        this.sortKey = 'USER'
        this.gsi1pk = email
        this.gsi2pk = phoneNumber

        // data fields
        this.firstName = firstName
        this.lastName = lastName
        this.email = email
        this.emailConfirmed = emailConfirmed === true
        this.phoneNumber = phoneNumber
        this.phoneNumberConfirmed = phoneNumberConfirmed === true

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}