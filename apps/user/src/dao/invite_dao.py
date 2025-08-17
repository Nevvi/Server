import os
import uuid
from datetime import datetime, timezone
from textwrap import dedent
from typing import List

import boto3
import pymongo
from pymongo.synchronous.collection import Collection
from types_boto3_sns import SNSClient

from src.model.document import UserInviteDocument


class InviteDao:
    def __init__(self):
        client = pymongo.MongoClient(os.environ.get("MONGO_URI"))
        self.collection: Collection[UserInviteDocument] = client.get_database("nevvi").get_collection("user_invites")

        self.sns: SNSClient = boto3.client("sns")

    def get_invites(self, phone_number: str) -> List[UserInviteDocument]:
        return list(self.collection.find(filter={"invitedPhoneNumber": phone_number}))

    def create_invite(self, phone_number: str, requesting_user_id: str, permission_group: str) -> UserInviteDocument:
        document = UserInviteDocument(
            _id=str(uuid.uuid4()),
            invitedPhoneNumber=phone_number,
            requesterUserId=requesting_user_id,
            requesterPermissionGroupName=permission_group,
            createDate=datetime.now(timezone.utc)
        )

        self.collection.insert_one(document)
        return document

    def send_invite(self, phone_number: str, message: str):
        self.sns.publish(PhoneNumber=phone_number, Message=message)


if __name__ == "__main__":
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    os.environ["MONGO_URI"] = "REPLACEME"
    invite_dao = InviteDao()

    message = dedent(f"""
        Test User has invited you to join Nevvi! 
        
        With Nevvi you never ask for an address again
        
        Get started: https://nevvi.net
        """)

    # invite_dao.create_invite(phone_number="+16129631237", requesting_user_id=str(uuid.uuid4()), permission_group="All Info")
    # invite_dao.send_invite(phone_number="+16129631237", message=message)
