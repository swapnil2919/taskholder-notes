from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class PhoneNotificationIngest(BaseModel):
    notif_id: Optional[str] = None
    app_name: str
    title: Optional[str] = None
    text: Optional[str] = None


class PhoneNotificationResponse(BaseModel):
    id: UUID
    notif_id: Optional[str] = None
    app_name: str
    title: Optional[str] = None
    text: Optional[str] = None
    is_read: bool
    received_at: datetime

    model_config = {"from_attributes": True}


class PhoneTokenResponse(BaseModel):
    phone_api_token: str


class ConnectionStatus(BaseModel):
    connected: bool
    last_seen: Optional[datetime] = None
