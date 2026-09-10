import logging
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.models.users import Users
from app.schemas.users import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


def get_all_users(db: Session) -> list[Users]:
    return db.query(Users).order_by(Users.created_at.desc()).all()


def get_user_by_id(db: Session, user_id: str) -> Users | None:
    return db.query(Users).filter(Users.user_id == user_id).first()


def create_user(db: Session, user_data: UserCreate) -> Users:
    count = db.query(Users).count()
    user_id = f"JL-{count + 1:02d}"
    existing = db.query(Users).filter(Users.user_id == user_id).first()
    if existing:
        user_id = f"JL-{count + 1:02d}-{uuid.uuid4().hex[:4].upper()}"

    final_pic_url = None
    if user_data.profile_pic_url:
        try:
            from app.core.supabase import upload_user_profile_pic
            final_pic_url = upload_user_profile_pic(user_id, user_data.profile_pic_url)
        except Exception as e:
            logger.warning(f"Failed to upload profile pic to storage for {user_id}: {e}")
            final_pic_url = user_data.profile_pic_url

    db_user = Users(
        user_id=user_id,
        user_name=user_data.user_name,
        email=user_data.email,
        phone=user_data.phone,
        city=user_data.city,
        state=user_data.state,
        country=user_data.country or "India",
        profile_pic_url=final_pic_url,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: str, user_update: UserUpdate) -> Users | None:
    db_user = get_user_by_id(db, user_id=user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: str) -> bool:
    db_user = get_user_by_id(db, user_id=user_id)
    if not db_user:
        return False

    try:
        from app.core.supabase import delete_user_profile_pic
        delete_user_profile_pic(user_id)
    except Exception as e:
        logger.warning(f"Error removing user profile storage for {user_id}: {e}")

    db.delete(db_user)
    db.commit()
    return True

