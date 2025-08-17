import uuid

from pydantic import BaseModel, Field


class UpdateTokenRequest(BaseModel):
    user_id: uuid.UUID = Field(...)
    token: str = Field(..., min_length=1)
