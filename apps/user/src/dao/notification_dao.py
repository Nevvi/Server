import json
import os

import boto3
from types_boto3_sqs import SQSClient


class NotificationDao:
    def __init__(self):
        self.sqs: SQSClient = boto3.client("sqs")
        self.notification_queue = os.environ["NOTIFICATION_QUEUE_URL"]

    def send_notification(self, user_id: str, title: str, body: str):
        self.sqs.send_message(
            QueueUrl=self.notification_queue,
            MessageBody=json.dumps({
                "userId": user_id,
                "title": title,
                "body": body
            })
        )
