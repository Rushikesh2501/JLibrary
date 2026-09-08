from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = None
SessionLocal = None

if settings.DATABASE_URL:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for SQLAlchemy ORM models
class Base(DeclarativeBase):
    pass


# Dependency function to provide a database session per request
def get_db():
    if not SessionLocal:
        raise RuntimeError("DATABASE_URL is not configured in .env")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

