'use strict'

import {RequestStatus} from "../../model/connection/RequestStatus";

module.exports = class {
    requestingUserId: string;
    requestedUserId: string;
    requestText: string;
    requesterImage: string;
    status: RequestStatus;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {requestingUserId, requestedUserId, requestText, requesterImage, status, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.requestingUserId = requestingUserId
        this.requestedUserId = requestedUserId
        this.requestText = requestText
        this.requesterImage = requesterImage
        this.status = status

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}