from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models import UserRole

# User schemas


class UserCreate(BaseModel):
    username: str
    name: str
    password: str
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    created_by_id: Optional[int] = None
    # Only used when creating/resetting password
    temp_password: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

# LogList schemas


class LogListCreate(BaseModel):
    name: str


class LogListRead(BaseModel):
    id: int
    name: str
    owner_id: int
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class LogListWithOwner(BaseModel):
    id: int
    name: str
    owner_id: int
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# CallLog schemas


class CallLogCreate(BaseModel):
    call_type: str
    log_list_id: int


class CallLogRead(BaseModel):
    id: int
    call_type: str
    timestamp: datetime

    class Config:
        from_attributes = True
