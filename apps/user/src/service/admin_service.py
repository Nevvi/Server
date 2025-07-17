import os

from dao.email_dao import EmailDao
from model.requests import DeleteAccountRequest


class AdminService:
    def __init__(self):
        self.email_dao = EmailDao()
        self.admin_email = os.environ["ADMIN_EMAIL"]

    def delete_account(self, request: DeleteAccountRequest):
        subject = "Delete user account"
        body = f"Request to delete user ${request.id}"

        self.email_dao.send_email(subject=subject, body=body, destination=self.admin_email)
        