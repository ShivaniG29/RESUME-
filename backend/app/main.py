import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import router
from backend.app.config import get_settings
from backend.app.database import Base, engine
from backend.app import models  # noqa: F401

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
settings = get_settings()
if settings.jwt_secret_key == "unsafe-development-secret-change-me":
    logging.getLogger(__name__).warning("Using the development JWT secret; configure JWT_SECRET_KEY before deployment.")

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Resume Analyzer API",
    description="Privacy-first resume analysis for students. Suggested roles are career matches, not vacancies.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(router)
