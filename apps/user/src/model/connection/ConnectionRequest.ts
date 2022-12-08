'use strict'

import {RequestStatus} from "./RequestStatus";
class ConnectionRequest {
    requestingUserId: string;
    requestedUserId: string;
    requestText: string;
    requesterImage: string;
    requestingPermissionGroupName: string;
    status: RequestStatus;
    createDate: string;
    createBy: string;
    updateDate: string;
    updateBy: string;
    constructor(body: object) {
        // @ts-ignore
        const {requestingUserId, requestedUserId, requestText, requesterImage, requestingPermissionGroupName, status, createDate, updateDate, updateBy, createBy} = body;

        // data fields
        this.requestingUserId = requestingUserId
        this.requestedUserId = requestedUserId
        this.requestText = requestText
        this.requestingPermissionGroupName = requestingPermissionGroupName || "ALL"
        this.requesterImage = requesterImage || process.env.DEFAULT_PROFILE_IMAGE
        this.status = status

        // audit fields
        this.createDate = createDate
        this.createBy = createBy
        this.updateDate = updateDate
        this.updateBy = updateBy
    }
}

export {ConnectionRequest}