"""Database session manager with MySQL connection and automatic SQLite fallback."""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

logger = logging.getLogger("burst.database")

Base = declarative_base()

# Initialize Engine with Fallback
try:
    # Attempt connecting to MySQL
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3}  # Fail fast if MySQL is down
    )
    # Validate connection
    with engine.connect() as conn:
        pass
    logger.info("Connected to MySQL database successfully.")
except Exception as e:
    logger.warning(
        f"MySQL connection failed. Falling back to an in-memory SQLite database. "
        f"Error details: {e}"
    )
    # Fallback to sqlite file database for easy development and offline testing
    engine = create_engine(
        "sqlite:///burst_dev.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency injection yield for DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
