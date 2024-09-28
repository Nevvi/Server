'use strict'

import {EmailDao} from "../dao/EmailDao";
import {DeleteAccountRequest} from "../model/request/DeleteAccountRequest";

class AdminService {
    private emailDao: EmailDao
    private readonly adminEmail: string

    constructor() {
        this.emailDao = new EmailDao()
        // @ts-ignore
        this.adminEmail = process.env.ADMIN_EMAIL
    }

    async deleteAccount(request: DeleteAccountRequest) {
        const subject = "Delete user account"
        const body = `Request to delete user ${request.id}`
        await this.emailDao.sendEmail(subject, body, this.adminEmail, null)
    }
}

export {AdminService}