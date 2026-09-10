from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.models.users import Users
from app.schemas.users import UserCreate


def get_all_users(db: Session) -> list[Users]:
    return db.query(Users).order_by(Users.created_at.desc()).all()


def create_user(db: Session, user_data: UserCreate) -> Users:
    count = db.query(Users).count()
    user_id = f"JL-{count + 1:02d}"
    existing = db.query(Users).filter(Users.user_id == user_id).first()
    if existing:
        user_id = f"JL-{count + 1:02d}-{uuid.uuid4().hex[:4].upper()}"

    db_user = Users(
        user_id=user_id,
        user_name=user_data.user_name,
        email=user_data.email,
        phone=user_data.phone,
        city=user_data.city,
        state=user_data.state,
        country=user_data.country or "India",
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

