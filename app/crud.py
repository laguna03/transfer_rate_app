from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import User, LogList, CallLog, UserRole
from app.schemas import UserCreate, UserUpdate
from app.auth import get_password_hash, generate_temp_password
from typing import List, Optional


def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate, created_by_id: int,
                temp_password: str = None) -> tuple[User, str]:
    """Create a new user."""
    # Generate temporary password if not provided
    is_temp_password = temp_password is None
    if temp_password is None:
        temp_password = generate_temp_password()

    hashed_password = get_password_hash(temp_password)

    db_user = User(
        username=user.username,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role,
        created_by_id=created_by_id,
        # Force password change if temp password was generated
        must_change_password=is_temp_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # No default log list creation - users will create their own lists as needed

    return db_user, temp_password


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user information."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def deactivate_user(db: Session, user_id: int) -> Optional[User]:
    """Deactivate a user account."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user


def activate_user(db: Session, user_id: int) -> Optional[User]:
    """Activate a user account."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    db_user.is_active = True
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_log_lists(db: Session, user_id: int) -> List[LogList]:
    """Get all log lists owned by a user."""
    return db.query(LogList).filter(LogList.owner_id == user_id).all()


def get_all_log_lists_for_admin(db: Session) -> List[LogList]:
    """Get all log lists in the system (administrator only)."""
    return db.query(LogList).all()


def can_access_log_list(db: Session, user: User, log_list_id: int) -> bool:
    """Check if user can access a specific log list."""
    if user.role == UserRole.ADMIN:
        return True

    log_list = db.query(LogList).filter(LogList.id == log_list_id).first()
    if not log_list:
        return False

    return log_list.owner_id == user.id


def reset_user_password(db: Session, user_id: int) -> tuple[Optional[User], str]:
    """Reset user password and return new temporary password."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None, ""

    temp_password = generate_temp_password()
    db_user.hashed_password = get_password_hash(temp_password)
    db_user.must_change_password = True  # Force password change on next login

    db.commit()
    db.refresh(db_user)

    return db_user, temp_password


def create_admin_user(db: Session, username: str, name: str, password: str) -> User:
    """Create the initial administrator user if none exists."""
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin_exists:
        raise ValueError("Administrator user already exists")

    admin_user = User(
        username=username,
        name=name,
        hashed_password=get_password_hash(password),
        role=UserRole.ADMIN,
        is_active=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return admin_user


def delete_user(db: Session, user_id: int) -> bool:
    """Permanently delete a user and all associated data."""
    db_user = get_user(db, user_id)
    if not db_user:
        return False

    # Delete all log lists owned by the user (this will cascade to call logs)
    db.query(LogList).filter(LogList.owner_id == user_id).delete()

    # Delete the user
    db.delete(db_user)
    db.commit()
    return True


def get_user_transfer_rate(db: Session, user_id: int, potential_sale_call_types: set) -> dict:
    """Calculate transfer rate for a specific user across all their log lists."""
    # Get all log lists for the user
    user_log_lists = db.query(LogList).filter(
        LogList.owner_id == user_id).all()

    total_calls = 0
    potential_calls = 0

    for log_list in user_log_lists:
        # Get all calls for this log list
        calls = db.query(CallLog).filter(
            CallLog.log_list_id == log_list.id).all()
        total_calls += len(calls)
        potential_calls += len(
            [c for c in calls if c.call_type in potential_sale_call_types])

    transfer_rate = (potential_calls / total_calls) * \
        100 if total_calls > 0 else 0

    return {
        "total_calls": total_calls,
        "potential_calls": potential_calls,
        "transfer_rate": round(transfer_rate, 2),
        "log_lists_count": len(user_log_lists)
    }


def get_all_log_lists_with_stats(db: Session, potential_sale_call_types: set) -> List[dict]:
    """Get all log lists with their statistics for administrator view."""
    log_lists = db.query(LogList).all()
    result = []

    for log_list in log_lists:
        # Get calls for this log list
        calls = db.query(CallLog).filter(
            CallLog.log_list_id == log_list.id).all()
        total_calls = len(calls)
        potential_calls = len(
            [c for c in calls if c.call_type in potential_sale_call_types])
        transfer_rate = (potential_calls / total_calls) * \
            100 if total_calls > 0 else 0

        # Get owner info
        owner = db.query(User).filter(User.id == log_list.owner_id).first()

        result.append({
            "id": log_list.id,
            "name": log_list.name,
            "owner_username": owner.username if owner else "Unknown",
            "owner_id": log_list.owner_id,
            "total_calls": total_calls,
            "potential_calls": potential_calls,
            "transfer_rate": round(transfer_rate, 2),
            "latest_call": calls[0].timestamp if calls else None
        })

    return result


def get_user_log_lists_with_calls(db: Session, user_id: int, potential_sale_call_types: set) -> List[dict]:
    """Get all log lists for a specific user with detailed call information."""
    log_lists = db.query(LogList).filter(LogList.owner_id == user_id).all()
    result = []

    for log_list in log_lists:
        # Get all calls for this log list, ordered by most recent first
        calls = db.query(CallLog).filter(
            CallLog.log_list_id == log_list.id
        ).order_by(CallLog.timestamp.desc()).all()

        total_calls = len(calls)
        potential_calls = len(
            [c for c in calls if c.call_type in potential_sale_call_types])
        transfer_rate = (potential_calls / total_calls) * \
            100 if total_calls > 0 else 0

        # Format calls for frontend
        calls_data = []
        for call in calls:
            calls_data.append({
                "id": call.id,
                "call_type": call.call_type,
                "timestamp": call.timestamp.isoformat() if call.timestamp else None,
                "is_potential_sale": call.call_type in potential_sale_call_types
            })

        result.append({
            "id": log_list.id,
            "name": log_list.name,
            "total_calls": total_calls,
            "potential_calls": potential_calls,
            "transfer_rate": round(transfer_rate, 2),
            "calls": calls_data
        })

    return result


def update_user_password(db: Session, user_id: int, new_password: str) -> bool:
    """Update user password and clear must_change_password flag."""
    db_user = get_user(db, user_id)
    if not db_user:
        return False

    db_user.hashed_password = get_password_hash(new_password)
    db_user.must_change_password = False

    db.commit()
    db.refresh(db_user)
    return True
