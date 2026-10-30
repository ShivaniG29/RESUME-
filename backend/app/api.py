import logging
import re
from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.app.config import get_settings
from backend.app.database import get_db
from backend.app.models import Analysis, Resume, User
from backend.app.schemas import (
    AnalyzeRequest,
    HistoryItem,
    LoginRequest,
    RegisterRequest,
    ResumeDetail,
    TokenResponse,
    UserResponse,
)
from backend.app.services.analyzer import analyze
from backend.app.services.extraction import ResumeExtractionError, extract_resume

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = str(payload.email).casefold()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(name=payload.name, email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id), user=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == str(payload.email).casefold()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenResponse(access_token=create_access_token(user.id), user=UserResponse.model_validate(user))


@router.get("/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/resume/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    filename = (file.filename or "").replace("\\", "/")
    filename = PurePosixPath(filename).name
    filename = re.sub(r"[\x00-\x1f\x7f]", "", filename)[:255]
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in {"pdf", "docx"}:
        raise HTTPException(status_code=415, detail="Upload a PDF or DOCX file.")
    content = await file.read(get_settings().max_upload_bytes + 1)
    if len(content) > get_settings().max_upload_bytes:
        raise HTTPException(status_code=413, detail="The file exceeds the 5 MiB upload limit.")
    try:
        extracted = extract_resume(filename, content)
    except ResumeExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await file.close()
    resume = Resume(user_id=user.id, filename=filename, extracted_text=extracted)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {"id": resume.id, "filename": resume.filename, "uploaded_at": resume.uploaded_at}


def _owned_resume(resume_id: int, user_id: int, db: Session) -> Resume:
    resume = db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id))
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


@router.post("/resume/analyze")
def analyze_resume(
    payload: AnalyzeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    resume = _owned_resume(payload.resume_id, user.id, db)
    report, mode = analyze(resume.extracted_text, payload.ai_consent)
    analysis = Analysis(
        resume_id=resume.id,
        resume_score=report.score_breakdown.total,
        report=report.model_dump(mode="json"),
        analysis_mode=mode,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return {
        "id": analysis.id,
        "resume_id": resume.id,
        "filename": resume.filename,
        "created_at": analysis.created_at,
        "analysis_mode": mode,
        "report": analysis.report,
    }


@router.get("/resume/history", response_model=list[HistoryItem])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[HistoryItem]:
    rows = db.execute(
        select(Analysis, Resume.filename)
        .join(Resume, Analysis.resume_id == Resume.id)
        .where(Resume.user_id == user.id)
        .order_by(Analysis.created_at.desc())
        .limit(100)
    ).all()
    return [
        HistoryItem(
            id=analysis.id,
            resume_id=analysis.resume_id,
            filename=filename,
            resume_score=analysis.resume_score,
            analysis_mode=analysis.analysis_mode,
            suggested_roles=[
                job.get("title", "")
                for job in analysis.report.get("job_recommendations", [])
                if job.get("title")
            ],
            created_at=analysis.created_at,
        )
        for analysis, filename in rows
    ]


@router.get("/resume/{resume_id}", response_model=ResumeDetail)
def get_resume(
    resume_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeDetail:
    resume = _owned_resume(resume_id, user.id, db)
    latest = db.scalar(
        select(Analysis).where(Analysis.resume_id == resume.id).order_by(Analysis.created_at.desc()).limit(1)
    )
    return ResumeDetail(
        id=resume.id,
        filename=resume.filename,
        uploaded_at=resume.uploaded_at,
        latest_analysis=(
            {
                "id": latest.id,
                "resume_score": latest.resume_score,
                "analysis_mode": latest.analysis_mode,
                "created_at": latest.created_at,
                "report": latest.report,
            }
            if latest
            else None
        ),
    )


@router.delete("/resume/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    resume = _owned_resume(resume_id, user.id, db)
    db.delete(resume)
    db.commit()
