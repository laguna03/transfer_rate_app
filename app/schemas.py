from pydantic import BaseModel
from datetime import datetime

class CallLogCreate(BaseModel):
    call_type: str

class CallLogRead(BaseModel):
    id: int
    call_type: str
    timestamp: datetime

    class Config:
        orm_mode = True
