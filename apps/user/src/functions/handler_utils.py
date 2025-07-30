import dataclasses
import json
import logging

from pydantic import ValidationError

from src.model.errors import HttpError
from src.model.view import View


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def exception_handler(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValidationError as e:
            logger.error(f"Caught validation error: {e}")
            return create_response(400, str(e))
        except HttpError as e:
            logger.error(f"Caught HTTP error: {e}")
            return create_response(e.status_code, e.message)
        except Exception as e:
            logger.error(f"Caught exception handling request: {e}")
            return create_response(500, str(e))

    return wrapper


def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'body': json.dumps(dataclasses.asdict(body)) if isinstance(body, View) else json.dumps(body)
    }
