from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class ContactMessageResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    status: str
    created_at: datetime
    replied_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ContactMessageStatusUpdate(BaseModel):
    status: str
