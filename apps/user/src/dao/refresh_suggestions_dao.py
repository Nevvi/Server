import json
import os

import boto3
from types_boto3_sqs import SQSClient


class RefreshSuggestionsDao:
    def __init__(self):
        self.sqs: SQSClient = boto3.client("sqs")
        self.refresh_suggestions_queue = os.environ["REFRESH_SUGGESTIONS_QUEUE_URL"]

    def send_refresh_suggestions_request(self, user_id: str):
        self.sqs.send_message(
            QueueUrl=self.refresh_suggestions_queue,
            MessageBody=json.dumps({
                "userId": user_id,
            })
        )
