from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.users import UsersResponse, UserCreate
from app.services import user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/", response_model=list[UsersResponse])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_all_users(db)


@router.post("/", response_model=UsersResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user_in)

