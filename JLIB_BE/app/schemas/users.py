from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    user_name: str
    email: str
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "India"


class UsersResponse(BaseModel):
    user_id: str
    user_name: str
    email: str
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

