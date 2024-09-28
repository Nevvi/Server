'use strict'


import {SES} from "aws-sdk";
const mimemessage = require('mimemessage');

class EmailDao {
    private ses: SES
    private fromArn: string
    constructor() {
        this.ses = new (require('aws-sdk')).SES()
        // @ts-ignore
        this.fromArn = process.env.EMAIL_FROM_ARN
    }

    async sendEmail(subject: string, body: string, destination: string, attachmentBase64: string | null) {
        const msg = mimemessage.factory({
            contentType: 'multipart/mixed',
            body: []
        });

        msg.header('Message-ID', '<1234qwerty>');

        // Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
        const alternateEntity = mimemessage.factory({
            contentType: 'multipart/alternate',
            body: []
        });

        // Build the plain text MIME entity.
        const plainEntity = mimemessage.factory({
            body: body
        });

        alternateEntity.body.push(plainEntity);

        if (attachmentBase64 != null) {
            const attachmentEntity = mimemessage.factory({
                contentType: 'text/plain',
                contentTransferEncoding: 'base64',
                body: attachmentBase64
            });
            attachmentEntity.header('Content-Disposition', `attachment ;filename="group.xlsx"`);
            alternateEntity.body.push(attachmentEntity);
        }

        // Add the multipart/alternate entity to the top-level MIME message.
        msg.body.push(alternateEntity);
        msg.header('To', destination);
        msg.header('From', 'Nevvi <email-no-reply@nevvi.net>');
        msg.header('Subject', subject);

        const emailStr = msg.toString()

        await this.ses.sendRawEmail({
            RawMessage: {
                Data: emailStr
            },
            FromArn: this.fromArn
        }).promise()
    }
}

export {EmailDao}