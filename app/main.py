from fastapi import FastAPI, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app import models
from app.database import SessionLocal, engine
from fastapi import HTTPException
from app.models import CallLog



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
def read_dashboard(request: Request, db: Session = Depends(get_db)):
    calls = db.query(models.CallLog).order_by(models.CallLog.timestamp.desc()).all()
    total_calls = len(calls)
    potential_calls = len([c for c in calls if c.call_type in POTENTIAL_SALE_CALL_TYPES])
    transfer_rate = (potential_calls / total_calls) * 100 if total_calls > 0 else 0

    return templates.TemplateResponse("index.html", {
        "request": request,
        "calls": calls,
        "transfer_rate": round(transfer_rate, 2),
        "potential_types": list(POTENTIAL_SALE_CALL_TYPES),
    })

# Endpoint to log a new call (POST /calls/)
from fastapi import status
from fastapi import HTTPException
from fastapi import Body

from app.schemas import CallLogCreate

@app.post("/calls/", status_code=status.HTTP_201_CREATED)
def log_call(call: CallLogCreate, db: Session = Depends(get_db)):
    if call.call_type not in (POTENTIAL_SALE_CALL_TYPES | {
        "CUSTOMER SERVICE", "INVALID", "PROVIDER", "BROKER", "U65",
        "LOYALTY", "CALLBLUE", "SEMINAR"
    }):
        raise HTTPException(status_code=400, detail="Invalid call type")

    new_call = models.CallLog(call_type=call.call_type)
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    return {"id": new_call.id, "call_type": new_call.call_type, "timestamp": new_call.timestamp}

@app.delete("/calls/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    db.delete(call)
    db.commit()
    return
