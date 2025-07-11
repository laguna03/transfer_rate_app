from fastapi import FastAPI, Depends, Request, status, HTTPException, Path
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app import models
from app.database import SessionLocal, engine
from app.models import CallLog, LogList
from app.schemas import CallLogCreate, LogListCreate, LogListRead


models.Base.metadata.create_all(bind=engine)

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


# Define your potential sale call types
POTENTIAL_SALE_CALL_TYPES = {
    "AOD", "APPOINTMENT", "T2", "HPA", "AFCT2", "AFCAPPOINTMENT", "NON-MED"
}

# Endpoint to serve the dashboard page with call data


@app.get("/", response_class=HTMLResponse)
def read_dashboard(request: Request, db: Session = Depends(get_db), log_list_id: int = None):
    log_lists = db.query(LogList).all()
    if not log_lists:
        default_list = LogList(name="Default")
        db.add(default_list)
        db.commit()
        db.refresh(default_list)
        log_lists = [default_list]
    if not log_list_id:
        log_list_id = log_lists[0].id
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
    })


@app.post("/log-lists/", response_model=LogListRead)
def create_log_list(log_list: LogListCreate, db: Session = Depends(get_db)):
    new_list = LogList(name=log_list.name)
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@app.get("/log-lists/", response_model=list[LogListRead])
def get_log_lists(db: Session = Depends(get_db)):
    return db.query(LogList).all()


@app.post("/calls/", status_code=status.HTTP_201_CREATED)
def log_call(call: CallLogCreate, db: Session = Depends(get_db)):
    if call.call_type not in (POTENTIAL_SALE_CALL_TYPES | {
        "CUSTOMER SERVICE", "INVALID", "PROVIDER", "BROKER", "U65",
        "LOYALTY", "CALLBLUE", "SEMINAR"
    }):
        raise HTTPException(status_code=400, detail="Invalid call type")
    log_list = db.query(LogList).filter(LogList.id == call.log_list_id).first()
    if not log_list:
        raise HTTPException(status_code=404, detail="Log list not found")
    new_call = CallLog(call_type=call.call_type, log_list_id=call.log_list_id)
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    return {"id": new_call.id, "call_type": new_call.call_type, "timestamp": new_call.timestamp}


@app.delete("/calls/{call_id}", status_code=204)
def delete_call(call_id: int = Path(...), db: Session = Depends(get_db)):
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call log not found")
    db.delete(call)
    db.commit()
    return


@app.delete("/log-lists/{log_list_id}", status_code=204)
def delete_log_list(log_list_id: int = Path(...), db: Session = Depends(get_db)):
    log_list = db.query(LogList).filter(LogList.id == log_list_id).first()
    if not log_list:
        raise HTTPException(status_code=404, detail="Log list not found")

    # Check if it's the last log list
    total_log_lists = db.query(LogList).count()
    if total_log_lists <= 1:
        raise HTTPException(
            status_code=400, detail="Cannot delete the last log list")

    # Delete all associated call logs first (cascade should handle this, but being explicit)
    db.query(CallLog).filter(CallLog.log_list_id == log_list_id).delete()

    # Delete the log list
    db.delete(log_list)
    db.commit()
    return
