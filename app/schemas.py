from pydantic import BaseModel
from datetime import datetime

class LogListCreate(BaseModel):
    name: str

class LogListRead(BaseModel):
    id: int
    name: str
    class Config:
        orm_mode = True

class CallLogCreate(BaseModel):
    call_type: str
    log_list_id: int  # Add this field

class CallLogRead(BaseModel):
    id: int
    call_type: str
    timestamp: datetime
    class Config:
        orm_mode = True
