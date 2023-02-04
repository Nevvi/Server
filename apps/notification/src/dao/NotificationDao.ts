import {messaging} from "firebase-admin";
import MessagingDevicesResponse = messaging.MessagingDevicesResponse;

class NotificationDao {
    private admin: any
    constructor() {
        this.admin = require("firebase-admin");
        const serviceAccount = require("./firebase_creds.json");
        this.admin.initializeApp({
            credential: this.admin.credential.cert(serviceAccount)
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