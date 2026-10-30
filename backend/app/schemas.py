from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AnalyzeRequest(BaseModel):
    resume_id: int = Field(gt=0)
    ai_consent: bool = False


class ScoreBreakdown(BaseModel):
    skills_relevance: int = Field(ge=0, le=100)
    resume_structure: int = Field(ge=0, le=100)
    experience_presentation: int = Field(ge=0, le=100)
    education_information: int = Field(ge=0, le=100)
    ats_readability: int = Field(ge=0, le=100)
    total: int = Field(ge=0, le=100)
    explanation: str = Field(max_length=1000)


class JobRecommendation(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    match_percentage: int = Field(ge=0, le=100)
    required_skills: list[str] = Field(max_length=20)
    matching_skills: list[str] = Field(max_length=20)
    missing_skills: list[str] = Field(max_length=20)


class MissingSkill(BaseModel):
    skill: str = Field(min_length=1, max_length=100)
    priority: str
    reason: str = Field(max_length=500)

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, value: str) -> str:
        if value not in {"high", "medium", "low"}:
            raise ValueError("Priority must be high, medium, or low")
        return value


class LearningSuggestion(BaseModel):
    skill: str = Field(min_length=1, max_length=100)
    importance: str = Field(max_length=500)
    topics: list[str] = Field(max_length=10)
    level: str
    resources: list[str] = Field(max_length=5)

    @field_validator("level")
    @classmethod
    def valid_level(cls, value: str) -> str:
        if value not in {"beginner", "intermediate", "advanced"}:
            raise ValueError("Level must be beginner, intermediate, or advanced")
        return value


class AnalysisReport(BaseModel):
    summary: str = Field(max_length=2000)
    education: list[str] = Field(max_length=20)
    experience: list[str] = Field(max_length=30)
    technical_skills: list[str] = Field(max_length=30)
    programming_languages: list[str] = Field(max_length=20)
    frameworks: list[str] = Field(max_length=20)
    databases: list[str] = Field(max_length=20)
    soft_skills: list[str] = Field(max_length=20)
    tools: list[str] = Field(max_length=20)
    certifications: list[str] = Field(max_length=20)
    achievements: list[str] = Field(max_length=20)
    job_recommendations: list[JobRecommendation] = Field(max_length=5)
    missing_skills: list[MissingSkill] = Field(max_length=30)
    learning_suggestions: list[LearningSuggestion] = Field(max_length=10)
    improvement_suggestions: list[str] = Field(max_length=20)
    score_breakdown: ScoreBreakdown


class HistoryItem(BaseModel):
    id: int
    resume_id: int
    filename: str
    resume_score: int
    analysis_mode: str
    suggested_roles: list[str] = Field(default_factory=list)
    created_at: datetime


class ResumeDetail(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    latest_analysis: dict | None
