from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class LogList(Base):
    __tablename__ = "log_lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    call_logs = relationship("CallLog", back_populates="log_list")

class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    call_type = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    log_list_id = Column(Integer, ForeignKey("log_lists.id"), nullable=False)
    log_list = relationship("LogList", back_populates="call_logs")
