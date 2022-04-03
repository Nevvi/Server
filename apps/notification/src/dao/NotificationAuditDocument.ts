'use strict'

import {NotificationAudit} from "../model/NotificationAudit";
import {AuditResult} from "../model/audit/AuditResult";

class NotificationAuditDocument {
    partitionKey: string
    sortKey: string
    gsi1pk: string
    gsi1sk: string
    id: string
    phoneNumber: string
    command: string
    groupCode: string
    message: string
    auditResult: AuditResult
    createDate: string
    constructor(id: string, phoneNumber: string, command: string, groupCode: string, message: string, auditResult: AuditResult, createDate: string) {
        // We want to primarily be able to search by phone number and date
        this.partitionKey = phoneNumber
        this.sortKey = `AUDIT^${createDate}^${id}`
        this.gsi1pk = groupCode
        this.gsi1sk = `AUDIT^${phoneNumber}^${id}`

        this.id = id
        this.phoneNumber = phoneNumber
        this.command = command
        this.groupCode = groupCode
        this.message = message
        this.auditResult = auditResult
        this.createDate = createDate
    }
}

function fromModel(model: NotificationAudit) : NotificationAuditDocument {
    return new NotificationAuditDocument(
        model.id,
        model.phoneNumber,
        model.command,
        model.groupCode,
        model.message,
        model.auditResult,
        model.createDate
    )
}

export {NotificationAuditDocument, fromModel}