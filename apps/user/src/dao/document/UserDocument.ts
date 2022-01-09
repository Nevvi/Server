'use strict'

module.exports = class {
    partitionKey: string;
    sortKey: string;
    gsi1pk: string;
    gsi2pk: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {phoneNumber, createDate, lastName, email, firstName, updateDate, updateBy, createBy} = body;

        // dynamodb fields
        this.partitionKey = email
        this.sortKey = 'USER'
        this.gsi1pk = email
        this.gsi2pk = phoneNumber

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