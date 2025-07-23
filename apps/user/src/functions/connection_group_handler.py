import logging

from functions.user_handler import exception_handler, create_response
from service.admin_service import AdminService
from service.suggestion_service import SuggestionService
from service.user_service import UserService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

user_service = UserService()
admin_service = AdminService()
suggestion_service = SuggestionService()


@exception_handler
def get_suggested_connections(event, context):
    path_params = event.get('pathParameters') or {}
    suggestions = suggestion_service.get_suggested_users(user_id=path_params.get("userId"))
    return create_response(200, suggestions)
