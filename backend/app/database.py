from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _normalize_database_url(url: str) -> str:
    # Render/Railway may provide postgres://; SQLAlchemy expects postgresql://.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


# Shared database engine for the API.
engine = create_engine(_normalize_database_url(settings.database_url))

# One database session is opened per request.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    # All SQLAlchemy models inherit from this base.
    pass


def get_db():
    # FastAPI dependency that closes the session after every request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
