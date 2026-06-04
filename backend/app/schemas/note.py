from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_pinned: bool = False
    category: Optional[str] = None
    task_id: Optional[UUID] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    category: Optional[str] = None
    task_id: Optional[UUID] = None

class NoteResponse(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
