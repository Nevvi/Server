'use strict'

import {User} from "../model/user/User";

const XLSX = require("xlsx");
import {EmailDao} from "../dao/EmailDao";
import {UserConnectionResponse} from "../model/response/UserConnectionResponse";

class ExportService {
    private emailDao: EmailDao
    constructor() {
        this.emailDao = new EmailDao()
    }

    async sendExport(groupName: string, user: User, connections: UserConnectionResponse[]) {
        const data = connections.map(connection => {
            return {
                "firstName": connection.firstName,
                "lastName": connection.lastName,
                "email": connection.email,
                "phone": connection.phoneNumber,
                "street": connection.address.street,
                "unit": connection.address.unit,
                "city": connection.address.city,
                "state": connection.address.state,
                "zipCode": connection.address.zipCode
            }
        })
        const workSheet = XLSX.utils.json_to_sheet(data);
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Connections");

        const workbookData = XLSX.writeXLSX(workBook, {
            type: "base64"
        })

        const subject = `${groupName} export`
        const body = `Hello ${user.firstName},\n\nAttached is the export for the ${connections.length} connection(s) in the ${groupName} group`

        await this.emailDao.sendEmail(subject, body, user.email, workbookData)
    }
}

export {ExportService}