from sqlalchemy.orm import Session
from app.models.users import Users


def get_all_users(db: Session) -> list[Users]:
    return db.query(Users).all()
