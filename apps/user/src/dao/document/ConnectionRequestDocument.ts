'use strict'

import {RequestStatus} from "../../model/connection/RequestStatus";

module.exports = class {
    partitionKey: string;
    sortKey: string;
    gsi1pk: string;
    gsi1sk: string;
    requestingUserId: string;
    requestedUserId: string;
    status: RequestStatus;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {requestingUserId, requestedUserId, status, createDate, updateDate, updateBy, createBy} = body;

        // dynamodb fields
        this.partitionKey = requestingUserId
        this.sortKey =  `CONNECTION_REQUEST^${requestedUserId}`
        this.gsi1pk =  requestedUserId
        this.gsi1sk =  `CONNECTION_REQUEST^${requestingUserId}`

        // data fields
        this.requestingUserId = requestingUserId
        this.requestedUserId = requestedUserId
        this.status = status

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}