import json
import logging
from typing import List, Any

from src.functions.handler_utils import create_response, exception_handler
from src.service.suggestion_service import SuggestionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

suggestion_service = SuggestionService()


@exception_handler
def get_suggested_connections(event, context):
    path_params = event.get('pathParameters') or {}
    suggestions = suggestion_service.get_suggested_users(user_id=path_params.get("userId"))
    return create_response(200, suggestions)


@exception_handler
def ignore_suggestion(event, context):
    path_params = event.get('pathParameters') or {}
    suggestion_service.ignore_suggestion(user_id=path_params.get("userId"),
                                         suggested_user_id=path_params.get("suggestionId"))
    return create_response(200, {"success": True})


@exception_handler
def refresh_all_suggestions(event, context):
    suggestion_service.refresh_all_suggestions()
    return create_response(200, {"success": True})


def refresh_suggestions(event, context):
    """
    {
        Records: [
            {
                messageId: '3893134d-697c-48ca-9479-3f733bf732db',
                receiptHandle: ...,
                body: '{ "userId": "abc-123" }',
                attributes: [Object],
                messageAttributes: {},
                md5OfBody: 'df2118f71df5bb86a3bfdc377505861b',
                eventSource: 'aws:sqs',
                eventSourceARN: 'arn:aws:sqs:us-east-1:275527036335:notifications-dev',
                awsRegion: 'us-east-1'
            }
        ]
    }
    """
    try:
        print("Received request to refresh suggestion(s)")
        records: List[Any] = event.get("Records", [])
        for record in records:
            try:
                details = json.loads(record.get("body"))
                user_id = details.get("userId")
                print(f"Refreshing suggestions for {user_id}")
                suggestion_service.refresh_suggestions(user_id=user_id)
            except Exception as e:
                logger.exception("Caught error refreshing suggestions", e)
    except Exception as e:
        logger.exception("Caught error refreshing suggestions", e)

    # Always return true no matter what
    return True
