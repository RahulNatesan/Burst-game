"""SQLAlchemy Database Models for MySQL/SQLite."""

import datetime
from sqlalchemy import Column, String, Integer, DateTime
from .session import Base


class User(Base):
    """User table to persist user details."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RoomModel(Base):
    """Persisted room record."""
    __tablename__ = "rooms"

    code = Column(String(6), primary_key=True, index=True)
    host_id = Column(String(36), nullable=False)
    status = Column(String(20), default="LOBBY")  # LOBBY, ACTIVE, FINISHED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GameModel(Base):
    """Game sessions tracking."""
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, index=True)
    room_code = Column(String(6), nullable=False)
    winner_id = Column(String(36), nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)


class GameScoreModel(Base):
    """Round score records."""
    __tablename__ = "game_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(36), nullable=False, index=True)
    player_id = Column(String(36), nullable=False)
    player_name = Column(String(50), nullable=False)
    total_score = Column(Integer, default=0)
