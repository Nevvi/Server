import base64
from io import BytesIO

import boto3
import os

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from types_boto3_ses import SESClient


class EmailDao:
    def __init__(self):
        self.ses: SESClient = boto3.client("ses")
        self.from_arn = os.environ["EMAIL_FROM_ARN"]

    def send_email(self, subject: str, body: str, destination: str, attachment_base64: Optional[str]):
        # Create message container
        msg = MIMEMultipart('mixed')
        msg['Subject'] = subject
        msg['From'] = 'Nevvi <email-no-reply@nevvi.net>'
        msg['To'] = destination

        # Create message body container
        msg_body = MIMEMultipart('alternative')

        # Add text part
        text_part = MIMEText(body, 'plain')
        msg_body.attach(text_part)

        # Attach the body to the message
        msg.attach(msg_body)

        if attachment_base64:
            # Decode base64 data
            attachment_bytes = base64.b64decode(attachment_base64)

            # Create attachment
            attachment = MIMEApplication(attachment_bytes)
            attachment.add_header('Content-Disposition', 'attachment', filename='group.xlsx')
            attachment.add_header('Content-Type', 'text/plain')

            # Attach to message
            msg.attach(attachment)

        self.ses.send_raw_email(
            FromArn=self.from_arn,
            RawMessage={'Data': msg.as_string()}
        )


if __name__ == "__main__":
    os.environ["EMAIL_FROM_ARN"] = "arn:aws:ses:us-east-1:275527036335:identity/nevvi.net"
    dao = EmailDao()

    import xlsxwriter
    # Create a new Excel file and add a worksheet.
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output, {"in_memory": True})
    worksheet = workbook.add_worksheet(name="Connections")

    data = [
        {
            "firstName": "John",
            "lastName": "Doe",
        },
        {
            "firstName": "Jane",
            "lastName": "Doe",
        }
    ]
    headers = list(data[0].keys())
    for col_num, header in enumerate(headers):
        worksheet.write(0, col_num, header)
    for row_num, row_data in enumerate(data):
        for col_num, key in enumerate(headers):
            worksheet.write(row_num + 1, col_num, row_data[key])

    workbook.close()
    output.seek(0)
    excel_bytes = output.read()
    base64_encoded_excel = base64.b64encode(excel_bytes).decode('UTF-8')

    dao.send_email(
        destination="tyler.cobb@nevvi.net",
        subject="Test Email with Attachment",
        body="This is a test email with an attachment.",
        attachment_base64=base64_encoded_excel
    )
