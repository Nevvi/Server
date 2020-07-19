'use strict'

module.exports = class {
    constructor(body) {
        // dynamodb fields
        this.partitionKey = body.username
        this.sortKey = 'USER'

        // data fields
        this.username = body.username
        this.firstName = body.firstName
        this.lastName = body.lastName
        this.email = body.email
        this.phoneNumber = body.phoneNumber

        // audit fields
        this.createDate = body.createDate
        this.createBy = body.createBy
        this.updateDate = body.updateDate
        this.updateBy = body.updateBy
    }
}