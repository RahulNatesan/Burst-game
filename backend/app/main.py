"""FastAPI application entry point for the Burst card game backend."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import engine, Base
from app.api import auth, rooms
from app.websocket import handlers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("burst")

# Create database tables on startup (SQLite fallback creates them instantly)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Burst Card Game Backend",
    description="Real-time multiplayer FastAPI & WebSocket backend for Burst card game.",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include APIs and Routers
app.include_router(auth.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(handlers.router)  # Mounted directly for websocket endpoint


@app.get("/api/health")
def health_check():
    """Server health check endpoint."""
    return {"status": "ok", "message": "Burst server is running."}
