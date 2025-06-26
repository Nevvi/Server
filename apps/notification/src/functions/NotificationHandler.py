import json
import logging
from typing import List, Any

from src.error.Errors import HttpError
from src.model.request.UpdateTokenRequest import UpdateTokenRequest
from src.service.NotificationService import NotificationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
service = NotificationService()


def update_device_token(event, context):
    """Create a new user"""
    try:
        path_params = event.get('pathParameters') or {}
        body = json.loads(event.get('body', '{}'))

        request = UpdateTokenRequest(user_id=path_params.get("userId"), token=body.get("token"))
        service.update_token(request=request)

        logger.info(f"Updated token for user with ID: {request.user_id}")
        return create_response(200, {})

    except HttpError as e:
        logger.error(f"Caught HTTP error: {e}")
        return create_response(e.status_code, {'error': e.message})
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return create_response(500, {'error': 'Internal server error'})


def send_notification(event, context):
    """
    {
        Records: [
            {
                messageId: '3893134d-697c-48ca-9479-3f733bf732db',
                receiptHandle: ...,
                body: '{ "userId": "abc-123", "title": "Hello, World", "body": "Hey from server!" }',
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
        logger.info("Received request to send notification(s)")
        records: List[Any] = event.get("Records", [])
        for record in records:
            try:
                details = json.loads(record.get("body"))
                user_id = details.get("userId")
                title = details.get("title")
                body = details.get("body")
                logger.info(f"Sending notification to {user_id}")
                service.send_notification(user_id=user_id, title=title, body=body)
            except Exception as e:
                logger.exception("Caught error sending notification", e)
    except Exception as e:
        logger.exception("Caught error sending notifications", e)

    # Always return true no matter what
    return True


def create_response(status_code, body, headers=None):
    """Create HTTP response"""
    if headers is None:
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }

    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body) if isinstance(body, (dict, list)) else body
    }