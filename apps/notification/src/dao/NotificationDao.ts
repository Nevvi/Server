import {messaging} from "firebase-admin";
import MessagingDevicesResponse = messaging.MessagingDevicesResponse;

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
        const payload = {
            notification: {
                title: title,
                body: body,
                badge: "1" // TODO - be more dynamic with this
            }
        };

        const response: MessagingDevicesResponse = await this.admin.messaging().sendToDevice(token, payload)
        console.log("Successfully sent message:", response);
    }
}

export {NotificationDao}