import pytest
from pydantic import ValidationError

from backend.app.schemas import AnalysisReport, LearningSuggestion, MissingSkill


def test_analysis_response_rejects_out_of_range_scores():
    payload = {
        "summary": "Candidate summary",
        "education": [],
        "experience": [],
        "technical_skills": [],
        "programming_languages": [],
        "frameworks": [],
        "databases": [],
        "soft_skills": [],
        "tools": [],
        "certifications": [],
        "achievements": [],
        "job_recommendations": [],
        "missing_skills": [],
        "learning_suggestions": [],
        "improvement_suggestions": [],
        "score_breakdown": {
            "skills_relevance": 101,
            "resume_structure": 60,
            "experience_presentation": 60,
            "education_information": 60,
            "ats_readability": 60,
            "total": 60,
            "explanation": "Invalid score",
        },
    }
    with pytest.raises(ValidationError):
        AnalysisReport.model_validate(payload)


def test_invalid_learning_level_and_priority_are_rejected():
    with pytest.raises(ValidationError):
        LearningSuggestion(skill="Python", importance="Useful", topics=[], level="expert", resources=[])
    with pytest.raises(ValidationError):
        MissingSkill(skill="Python", priority="urgent", reason="Missing")
