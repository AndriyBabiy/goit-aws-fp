from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import crud, models, schemas
from .database import SessionLocal, engine

# This creates the 'subscribers' table if it doesn't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Middleware ---
# This allows your frontend (on a different domain) to talk to your backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your CloudFront domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency for getting a DB session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/subscribe", response_model=schemas.Subscriber)
def subscribe_to_newsletter(subscriber: schemas.SubscriberCreate, db: Session = Depends(get_db)):
    db_subscriber = crud.get_subscriber_by_email(db, email=subscriber.email)
    if db_subscriber:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_subscriber(db=db, subscriber=subscriber)

@app.get("/api/subscribers", response_model=List[schemas.Subscriber])
def read_subscribers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscribers = crud.get_subscribers(db, skip=skip, limit=limit)
    return subscribers