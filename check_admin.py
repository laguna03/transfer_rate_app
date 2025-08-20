#!/usr/bin/env python3
import sys
import os

# Add the current directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app.auth import get_password_hash
from app.models import User, UserRole
from app.database import SessionLocal, engine


def check_and_create_admin():
    db = SessionLocal()
    try:
        # Check if there are any users
        users = db.query(User).all()
        print(f"Found {len(users)} users in database")

        # Check if there's an admin user
        admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
        print(f"Found {len(admin_users)} admin users")

        if not admin_users:
            print("Creating admin user...")
            admin_user = User(
                username="admin",
                name="Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created: username=admin, password=admin123")
        else:
            for admin in admin_users:
                print(f"Admin user exists: {admin.username} ({admin.name})")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    check_and_create_admin()
