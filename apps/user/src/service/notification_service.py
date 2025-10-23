import asyncio
import logging
from datetime import datetime

import pytz

from src.dao.connection_dao import ConnectionDao, SearchedConnection
from src.dao.notification_dao import NotificationDao
from src.model.user.user import UserView
from src.service.user_service import UserService

eastern_timezone = pytz.timezone('US/Eastern')

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.user_service = UserService()
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

    async def notify_birthdays(self):
        now_eastern = datetime.now(eastern_timezone)
        logger.info(f"Current time in Eastern timezone: {now_eastern}")
        users = self.user_service.get_users_by_birthday(birthday=now_eastern)
        logger.info(f"Found {len(users)} users with birthdays today")

        async def notify_connection(user: UserView, connection: SearchedConnection):
            text = f"It's ${user.firstName} ${user.lastName}'s birthday!"
            body = f"Wish them a happy birthday"
            connection_user = self.user_service.get_user(user_id=connection.id)
            if connection_user.deviceSettings.notifyBirthdays:
                logger.info(f"Notifying ${connection.id} about birthday for ${user.id}")
                return self.notification_dao.send_notification(connection.id, text, body)
            return None

        async def notify_connections(user: UserView):
            connections = self.connection_dao.get_connections(user_id=user.id, limit=100000, skip=0)
            user_tasks = [notify_connection(user, connection) for connection in connections.connections]
            await asyncio.gather(*user_tasks)

        tasks = [notify_connections(user) for user in users]
        logger.info(f"Waiting for {len(tasks)} user birthday tasks")
        await asyncio.gather(*tasks)
        logger.info(f"Done sending notifications for {len(users)} users with birthdays today")
