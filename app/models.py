from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    log_lists = relationship("LogList", back_populates="owner")
    created_by = relationship("User", remote_side=[id])


class LogList(Base):
    __tablename__ = "log_lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    call_logs = relationship(
        "CallLog", back_populates="log_list", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="log_lists")


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    call_type = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True),
                       server_default=func.now(), nullable=False)
    log_list_id = Column(Integer, ForeignKey("log_lists.id"), nullable=False)
    log_list = relationship("LogList", back_populates="call_logs")
