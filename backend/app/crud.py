from sqlalchemy.orm import Session
from . import models, schemas

def get_subscriber_by_email(db: Session, email: str):
    return db.query(models.Subscriber).filter(models.Subscriber.email == email).first()

def get_subscribers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Subscriber).offset(skip).limit(limit).all()

def create_subscriber(db: Session, subscriber: schemas.SubscriberCreate):
    db_subscriber = models.Subscriber(email=subscriber.email)
    db.add(db_subscriber)
    db.commit()
    db.refresh(db_subscriber)
    return db_subscriber