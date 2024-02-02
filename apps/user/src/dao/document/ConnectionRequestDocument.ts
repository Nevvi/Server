'use strict'

import {RequestStatus} from "../../model/connection/RequestStatus";

module.exports = class {
    requestingUserId: string;
    requestedUserId: string;
    requesterFirstName: string;
    requesterLastName: string;
    requesterImage: string;
    requestingPermissionGroupName: string;
    status: RequestStatus;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;

    constructor(body: object) {
        // @ts-ignore
        const {requestingUserId, requestedUserId, requesterFirstName, requesterLastName, requesterImage, requestingPermissionGroupName, status, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.requestingUserId = requestingUserId
        this.requestedUserId = requestedUserId
        this.requesterFirstName = requesterFirstName
        this.requesterLastName = requesterLastName
        this.requesterImage = requesterImage
        this.requestingPermissionGroupName = requestingPermissionGroupName
        this.status = status

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}