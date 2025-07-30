from src.dao.connection_dao import ConnectionDao
from src.dao.notification_dao import NotificationDao
from src.dao.user_dao import UserDao


class NotificationService:
    def __init__(self):
        self.user_dao = UserDao()
        self.connection_dao = ConnectionDao()
        self.notification_dao = NotificationDao()

    def send_notification(self, user_id: str, message: str, title: str = "Nevvi"):
        self.notification_dao.send_notification(user_id=user_id, title="Nevvi", body=message)

    def notify_out_of_sync_users(self) -> int:
        skip = 0
        limit = 500
        notified = 0
        users = self.connection_dao.get_users_with_out_of_sync_connections(skip=skip, limit=limit)

        while len(users):
            for user_id in users:
                self.send_notification(user_id=user_id, title="Your connections are out of sync!",
                                       message="Open the app to sync your device")

            notified = notified + len(users)
            skip = skip + limit
            users = self.connection_dao.get_users_with_out_of_sync_connections(skip=skip, limit=limit)

        return notified

    def notify_birthdays(self) -> int:
        pass
