from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    user_name: str
    email: str
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "India"
    profile_pic_url: str | None = None


class UserUpdate(BaseModel):
    user_name: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    profile_pic_url: str | None = None


class UsersResponse(BaseModel):
    user_id: str
    user_name: str
    email: str
    phone: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    created_at: datetime
    profile_pic_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

