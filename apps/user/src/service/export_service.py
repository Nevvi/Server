import base64
from io import BytesIO
from typing import List, Dict, Any

import xlsxwriter

from dao.email_dao import EmailDao
from model.connection.connection import UserConnectionView
from model.user.user import UserView


class ExportService:
    def __init__(self):
        self.email_dao = EmailDao()

    def send_export(self, group_name: str, user: UserView, connections: List[UserConnectionView]):
        data = list(map(self.__transform_connection, connections))

        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet(name="Connections")

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
        subject = f"{group_name} export"
        body = f"Hello {user.firstName},\n\nAttached is the export for the {len(connections)} connection(s) in the {group_name} group"
        self.email_dao.send_email(subject=subject, body=body, destination=user.email,
                                  attachment_base64=base64_encoded_excel)

    @staticmethod
    def __transform_connection(connection: UserConnectionView) -> Dict[str, Any]:
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
