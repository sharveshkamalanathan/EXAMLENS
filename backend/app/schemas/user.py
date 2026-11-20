from typing import Optional
from pydantic import BaseModel, field_validator
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: str
    role: str = "teacher"  # teacher, student, admin
    institution: Optional[str] = "National Institute of Technology"
    department: Optional[str] = "Computer Science & Engineering"
    roll_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PasswordResetRequest(BaseModel):
    email: str
    new_password: str

class PasswordResetResponse(BaseModel):
    success: bool
    message: str
