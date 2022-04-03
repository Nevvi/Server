'use strict'

// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {NotificationAuditDocument} from "../dao/NotificationAuditDocument";
import {AuditResult} from "./audit/AuditResult";

class NotificationAudit {
    id: string
    phoneNumber: string
    command: string
    groupCode: string
    message: string
    auditResult: AuditResult
    createDate: string
    constructor(id: string, phoneNumber: string, command: string, groupCode: string, message: string, auditResult: AuditResult, createDate: string) {
        this.id = id
        this.phoneNumber = phoneNumber
        this.command = command
        this.groupCode = groupCode
        this.message = message
        this.auditResult = auditResult
        this.createDate = createDate
    }
}

function newNotificationAudit(phoneNumber: string, command: string, groupCode: string, message: string, auditResult: AuditResult): NotificationAudit {
    return new NotificationAudit(
        uuidv4(),
        phoneNumber,
        command,
        groupCode,
        message,
        auditResult,
        new Date().toISOString()
    )
}

function fromDocument(document: NotificationAuditDocument) : NotificationAudit {
    return new NotificationAudit(
        document.id,
        document.phoneNumber,
        document.command,
        document.groupCode,
        document.message,
        document.auditResult,
        document.createDate
    )
}

export {NotificationAudit, newNotificationAudit, fromDocument}