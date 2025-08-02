from pydantic import BaseModel, EmailStr

# Schema for creating a new subscriber (input)
class SubscriberCreate(BaseModel):
    email: EmailStr

# Schema for reading a subscriber from the DB (output)
class Subscriber(SubscriberCreate):
    id: int

    class Config:
        orm_mode = True