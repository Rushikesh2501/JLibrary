from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.users import UsersResponse
from app.services import user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/", response_model=list[UsersResponse])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_all_users(db)
