from src.dao.user_dao import UserDao


class UserService:
    def __init__(self):
        self.user_dao = UserDao()

    def create_user(self, id: str, phone_number: str):
        self.user_dao.create_user(id=id, phone_number=phone_number)

    def confirm_user_email(self, id: str):
        self.user_dao.confirm_user_email(id=id)
