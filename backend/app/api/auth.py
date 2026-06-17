"""Guest authentication API router for Burst."""

import uuid
import datetime
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.database.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# Authorization: Bearer <token>
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


class GuestAuthRequest(BaseModel):
    """Payload to create a guest player."""
    username: str = Field(..., min_length=2, max_length=20)
    avatar_url: Optional[str] = ""


class TokenResponse(BaseModel):
    """Authentication response payload."""
    token: str
    player_id: str
    username: str
    avatar_url: str


def create_token(player_id: str, username: str, avatar_url: str) -> str:
    """Create a signed JWT token for a player."""
    expiration = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "player_id": player_id,
        "username": username,
        "avatar_url": avatar_url,
        "exp": expiration
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_player_from_token(token: str) -> dict:
    """Decode token and return player details, raising HTTPException if invalid."""
    try:
        # Strip "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return {
            "player_id": payload["player_id"],
            "username": payload["username"],
            "avatar_url": payload["avatar_url"]
        }
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Session has expired or is invalid. Please log in again."
        )


def get_current_player(auth_header: Optional[str] = Security(api_key_header)) -> dict:
    """Dependency injection to get the current authenticated player from requests."""
    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization Header."
        )
    return get_current_player_from_token(auth_header)


@router.post("/guest", response_model=TokenResponse)
def guest_login(request: GuestAuthRequest, db: Session = Depends(get_db)):
    """Log in as a guest, creating a DB record and returning a JWT token."""
    username = request.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")
    
    player_id = str(uuid.uuid4())
    avatar_url = request.avatar_url or ""

    try:
        db_user = User(
            id=player_id,
            username=username,
            avatar_url=avatar_url
        )
        db.add(db_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error during user persistence: {e}"
        )

    token = create_token(player_id, username, avatar_url)

    return TokenResponse(
        token=token,
        player_id=player_id,
        username=username,
        avatar_url=avatar_url
    )
