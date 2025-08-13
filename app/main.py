from fastapi import FastAPI, Depends, Request, status, HTTPException, Path, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, crud, auth
from app.database import SessionLocal, engine
from app.models import CallLog, LogList, User, UserRole
from app.schemas import (
    CallLogCreate, LogListCreate, LogListRead,
    UserCreate, UserUpdate, UserResponse, Token,
    LogListWithOwner
)


app = FastAPI()

# Mount static files (css, js)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup Jinja2 templates folder
templates = Jinja2Templates(directory="app/templates")

# Dependency to get DB session


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.post("/login")
async def login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, username, password)
    if not user or not user.is_active:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "Invalid credentials or account deactivated"
        })

    # Create token and redirect based on user role
    access_token = auth.create_access_token(data={"sub": user.username})

    # Redirect administrators to administrator dashboard, regular users to main dashboard
    if user.role == UserRole.ADMIN:
        redirect_url = "/admin/dashboard"
    else:
        redirect_url = "/"

    response = RedirectResponse(
        url=redirect_url, status_code=status.HTTP_302_FOUND)
    response.set_cookie(key="access_token",
                        value=f"Bearer {access_token}", httponly=True)
    return response


@app.get("/logout")
def logout():
    response = RedirectResponse(
        url="/login", status_code=status.HTTP_302_FOUND)
    response.delete_cookie(key="access_token")
    return response


# Define your potential sale call types
POTENTIAL_SALE_CALL_TYPES = {
    "AOD", "APPOINTMENT", "T2", "HPA", "AFCT2", "AFCAPPOINTMENT", "NON-MED"
}


# User Management Endpoints (Administrator only)
@app.get("/admin/users", response_model=List[UserResponse])
def get_users(
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    return crud.get_users(db)


@app.post("/admin/users", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Check if user already exists
    if crud.get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    if crud.get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Create user with provided password
    print(f"Creating user with provided password")

    new_user, actual_password = crud.create_user(
        db=db,
        user=user_data,
        created_by_id=current_user.id,
        temp_password=user_data.password  # Use the password from the form
    )

    print(f"User created successfully")

    # Return user without password in response (password is no longer temporary)
    response = UserResponse.model_validate(new_user)
    print(f"Full response: {response}")
    return response


@app.put("/admin/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.update_user(db, user_id, user_data)


@app.post("/admin/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )

    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.deactivate_user(db, user_id)


@app.post("/admin/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.activate_user(db, user_id)


@app.post("/admin/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user, temp_password = crud.reset_user_password(db, user_id)

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    # TODO: Send email with new password
    # For now, return it to admin
    return {"message": "Password reset successfully", "temp_password": temp_password}


@app.get("/admin/dashboard", response_class=HTMLResponse)
def admin_dashboard(
    request: Request,
    db: Session = Depends(get_db)
):
    # Use the web authentication function that handles redirects
    auth_result = auth.get_current_user_web(request, db)
    if isinstance(auth_result, RedirectResponse):
        return auth_result

    current_user = auth_result

    # Check if user is admin
    if current_user.role != UserRole.ADMIN:
        return RedirectResponse(url="/", status_code=302)

    # Get users with their transfer rate data
    users = crud.get_users(db)
    users_with_stats = []

    for user in users:
        if user.role == UserRole.USER:  # Only calculate for regular users
            user_stats = crud.get_user_transfer_rate(
                db, user.id, POTENTIAL_SALE_CALL_TYPES)
            users_with_stats.append({
                "user": user,
                "transfer_rate": user_stats["transfer_rate"],
                "total_calls": user_stats["total_calls"],
                "potential_calls": user_stats["potential_calls"],
                "log_lists_count": user_stats["log_lists_count"]
            })
        else:
            users_with_stats.append({
                "user": user,
                "transfer_rate": None,  # Administrators don't have transfer rates
                "total_calls": 0,
                "potential_calls": 0,
                "log_lists_count": 0
            })

    # Get all log lists with statistics
    log_lists_with_stats = crud.get_all_log_lists_with_stats(
        db, POTENTIAL_SALE_CALL_TYPES)

    return templates.TemplateResponse("admin_dashboard.html", {
        "request": request,
        "users": users,
        "users_with_stats": users_with_stats,
        "log_lists_with_stats": log_lists_with_stats,
        "current_user": current_user
    })

# Endpoint to serve the dashboard page with call data


@app.get("/", response_class=HTMLResponse)
def read_dashboard(
    request: Request,
    log_list_id: int = None,
    db: Session = Depends(get_db)
):
    # Use the web authentication function that handles redirects
    auth_result = auth.get_current_user_web(request, db)
    if isinstance(auth_result, RedirectResponse):
        return auth_result

    current_user = auth_result

    # Redirect administrators to administrator dashboard - they don't use the user dashboard
    if current_user.role == UserRole.ADMIN:
        return RedirectResponse(url="/admin/dashboard", status_code=302)

    # Get log lists for regular users only
    log_lists = db.query(LogList).filter(
        LogList.owner_id == current_user.id).all()

    if not log_lists:
        # Regular user has no lists - they need to create one
        return templates.TemplateResponse("index.html", {
            "request": request,
            "calls": [],
            "transfer_rate": 0,
            "potential_types": list(POTENTIAL_SALE_CALL_TYPES),
            "log_lists": [],
            "current_log_list_id": None,
            "current_user": current_user,
            "message": "You don't have any log lists yet. Create your first log list to start tracking calls."
        })

    if not log_list_id:
        log_list_id = log_lists[0].id

    # Verify user has access to the selected log list
    selected_list = db.query(LogList).filter(LogList.id == log_list_id).first()
    if not selected_list:
        raise HTTPException(status_code=404, detail="Log list not found")

    if current_user.role != UserRole.ADMIN and selected_list.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Access denied to this log list")

    calls = db.query(CallLog).filter(CallLog.log_list_id ==
                                     log_list_id).order_by(CallLog.timestamp.desc()).all()
    total_calls = len(calls)
    potential_calls = len(
        [c for c in calls if c.call_type in POTENTIAL_SALE_CALL_TYPES])
    transfer_rate = (potential_calls / total_calls) * \
        100 if total_calls > 0 else 0

    return templates.TemplateResponse("index.html", {
        "request": request,
        "calls": calls,
        "transfer_rate": round(transfer_rate, 2),
        "potential_types": list(POTENTIAL_SALE_CALL_TYPES),
        "log_lists": log_lists,
        "current_log_list_id": log_list_id,
        "current_user": current_user
    })


@app.post("/log-lists/", response_model=LogListRead)
def create_log_list(
    log_list: LogListCreate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Administrators should not create log lists - they use administrator dashboard only
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Administrators cannot create log lists. Use the administrator dashboard to manage users."
        )

    new_list = LogList(name=log_list.name, owner_id=current_user.id)
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@app.get("/log-lists/", response_model=List[LogListWithOwner])
def get_log_lists(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        return db.query(LogList).all()
    else:
        return db.query(LogList).filter(LogList.owner_id == current_user.id).all()


@app.post("/calls/", status_code=status.HTTP_201_CREATED)
def log_call(
    call: CallLogCreate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Administrators should not log calls - they use administrator dashboard only
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Administrators cannot log calls. Use the administrator dashboard to manage users and view data."
        )

    if call.call_type not in (POTENTIAL_SALE_CALL_TYPES | {
        "CUSTOMER SERVICE", "INVALID", "PROVIDER", "BROKER", "U65",
        "LOYALTY", "CALLBLUE", "SEMINAR"
    }):
        raise HTTPException(status_code=400, detail="Invalid call type")

    log_list = db.query(LogList).filter(LogList.id == call.log_list_id).first()
    if not log_list:
        raise HTTPException(status_code=404, detail="Log list not found")

    # Check if user has access to this log list (only regular users now)
    if log_list.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Access denied to this log list")

    new_call = CallLog(call_type=call.call_type, log_list_id=call.log_list_id)
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    return {"id": new_call.id, "call_type": new_call.call_type, "timestamp": new_call.timestamp}


@app.delete("/calls/{call_id}", status_code=204)
def delete_call(
    call_id: int = Path(...),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call log not found")

    # Check if user has access to this call's log list
    log_list = db.query(LogList).filter(LogList.id == call.log_list_id).first()
    if current_user.role != UserRole.ADMIN and log_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(call)
    db.commit()
    return


@app.delete("/log-lists/{log_list_id}", status_code=204)
def delete_log_list(
    log_list_id: int = Path(...),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    log_list = db.query(LogList).filter(LogList.id == log_list_id).first()
    if not log_list:
        raise HTTPException(status_code=404, detail="Log list not found")

    # Check if user has access to this log list
    if current_user.role != UserRole.ADMIN and log_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if it's the last log list for this user
    if current_user.role == UserRole.ADMIN:
        total_log_lists = db.query(LogList).count()
    else:
        total_log_lists = db.query(LogList).filter(
            LogList.owner_id == current_user.id).count()

    if total_log_lists <= 1:
        raise HTTPException(
            status_code=400, detail="Cannot delete the last log list")

    # Delete all associated call logs first (cascade should handle this, but being explicit)
    db.query(CallLog).filter(CallLog.log_list_id == log_list_id).delete()

    # Delete the log list
    db.delete(log_list)
    db.commit()
    return


# Initialization endpoint for first administrator user
@app.post("/init-admin")
def initialize_admin(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check if any administrator already exists
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin:
        raise HTTPException(
            status_code=400,
            detail="Administrator user already exists"
        )

    # Create the first admin user
    admin_user = crud.create_admin_user(db, username, email, password)
    return {"message": "Admin user created successfully", "username": admin_user.username}


@app.get("/init", response_class=HTMLResponse)
def init_page(request: Request, db: Session = Depends(get_db)):
    # Check if any admin already exists
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin:
        return RedirectResponse(url="/login", status_code=302)

    return templates.TemplateResponse("init_admin.html", {"request": request})


# Startup event to ensure tables are created
@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=engine)

# Debug endpoint to check authentication


@app.get("/debug/auth")
def debug_auth(request: Request, db: Session = Depends(get_db)):
    """Debug endpoint to check authentication status."""
    cookie_token = request.cookies.get("access_token")
    return {
        "has_cookie": bool(cookie_token),
        "cookie_value": cookie_token[:20] + "..." if cookie_token else None,
        "cookies": dict(request.cookies)
    }


@app.delete("/admin/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )

    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has any log lists with data
    user_log_lists = db.query(LogList).filter(
        LogList.owner_id == user_id).all()
    total_calls = 0
    for log_list in user_log_lists:
        call_count = db.query(CallLog).filter(
            CallLog.log_list_id == log_list.id).count()
        total_calls += call_count

    if total_calls > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user with {total_calls} call log entries. Please transfer or delete the data first."
        )

    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")


@app.get("/admin/users/{user_id}/details")
def get_user_details(
    user_id: int,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a user including their log lists and calls."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's log lists with call details
    user_log_lists = crud.get_user_log_lists_with_calls(
        db, user_id, POTENTIAL_SALE_CALL_TYPES)

    # Calculate overall stats
    user_stats = crud.get_user_transfer_rate(
        db, user_id, POTENTIAL_SALE_CALL_TYPES)

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "stats": user_stats,
        "log_lists": user_log_lists
    }
