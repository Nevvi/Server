import {messaging} from "firebase-admin";
import MessagingDevicesResponse = messaging.MessagingDevicesResponse;
import {TokenMessage} from "firebase-admin/lib/messaging";

class NotificationDao {
    private admin: any
    constructor() {
        this.admin = require("firebase-admin");
        // @ts-ignore
        const serviceAccount = new Buffer(process.env.FIREBASE_CREDENTIALS, 'base64').toString();
        this.admin.initializeApp({
            credential: this.admin.credential.cert(JSON.parse(serviceAccount))
        });
    }

    async sendNotification(token: string, title: string, body: string) {
        const payload: TokenMessage = {
            token: token,
            notification: {
                title: title,
                body: body,
            }
        };


        const response: MessagingDevicesResponse = await this.admin.messaging().send(payload)
        console.log("Successfully sent message:", response);
    }
}

export {NotificationDao}