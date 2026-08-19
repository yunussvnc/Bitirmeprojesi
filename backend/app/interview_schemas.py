from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)


class InterviewStrength(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    evidence: str = Field(min_length=1, max_length=1500)
    how_to_use: str = Field(min_length=1, max_length=1000)


class InterviewGap(StrictModel):
    skill: str = Field(min_length=1, max_length=200)
    priority: Literal["yüksek", "orta", "düşük", "high", "medium", "low"]
    risk: str = Field(min_length=1, max_length=1000)
    action: str = Field(min_length=1, max_length=1500)


class StudyPlanDay(StrictModel):
    day: int = Field(ge=1, le=14)
    focus: str = Field(min_length=1, max_length=300)
    tasks: list[str] = Field(min_length=1, max_length=8)
    success_metric: str = Field(min_length=1, max_length=600)

    @field_validator("tasks")
    @classmethod
    def validate_tasks(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip()[:500] for item in value if isinstance(item, str) and item.strip()]
        if not cleaned:
            raise ValueError("En az bir geçerli görev gerekir.")
        return cleaned


class InterviewAnalysis(StrictModel):
    executive_summary: str = Field(min_length=1, max_length=3000)
    match_score: int = Field(ge=0, le=100)
    strengths: list[InterviewStrength] = Field(min_length=1, max_length=8)
    gaps: list[InterviewGap] = Field(default_factory=list, max_length=8)
    keywords: list[str] = Field(min_length=1, max_length=30)
    company_focus: list[str] = Field(min_length=1, max_length=12)
    likely_interview_stages: list[str] = Field(min_length=1, max_length=10)
    elevator_pitch: str = Field(min_length=1, max_length=4000)
    questions_to_ask: list[str] = Field(min_length=1, max_length=12)
    study_plan: list[StudyPlanDay] = Field(min_length=1, max_length=14)
    final_checklist: list[str] = Field(min_length=1, max_length=20)

    @field_validator("keywords", "company_focus", "likely_interview_stages", "questions_to_ask", "final_checklist")
    @classmethod
    def clean_string_lists(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip()[:1000] for item in value if isinstance(item, str) and item.strip()]
        if not cleaned:
            raise ValueError("Liste en az bir geçerli metin içermelidir.")
        return cleaned


class GeneratedQuestion(StrictModel):
    category: Literal["opening", "cv_deep_dive", "behavioral", "technical", "role_specific", "company", "failure", "pressure", "closing"]
    difficulty: Literal["kolay", "orta", "zor", "easy", "medium", "hard"]
    question: str = Field(min_length=5, max_length=2000)
    rationale: str = Field(min_length=1, max_length=1000)
    answer_framework: list[str] = Field(min_length=1, max_length=6)
    evaluation_criteria: list[str] = Field(min_length=1, max_length=6)

    @field_validator("answer_framework", "evaluation_criteria")
    @classmethod
    def clean_guidance(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip()[:500] for item in value if isinstance(item, str) and item.strip()]
        if not cleaned:
            raise ValueError("En az bir geçerli madde gerekir.")
        return cleaned


class StarFeedback(StrictModel):
    situation: str = Field(default="", max_length=1000)
    task: str = Field(default="", max_length=1000)
    action: str = Field(default="", max_length=1000)
    result: str = Field(default="", max_length=1000)


class AnswerFeedback(StrictModel):
    score: int = Field(ge=0, le=100)
    verdict: Literal["güçlü", "gelişiyor", "yetersiz", "strong", "developing", "insufficient"]
    strengths: list[str] = Field(default_factory=list, max_length=8)
    improvements: list[str] = Field(default_factory=list, max_length=8)
    star_feedback: StarFeedback = Field(default_factory=StarFeedback)
    improved_answer: str = Field(min_length=1, max_length=5000)
    next_drill: str = Field(min_length=1, max_length=1500)

    @field_validator("strengths", "improvements")
    @classmethod
    def clean_feedback_lists(cls, value: list[str]) -> list[str]:
        return [item.strip()[:1000] for item in value if isinstance(item, str) and item.strip()]


class InterviewPlanCreate(BaseModel):
    role_title: str = Field(min_length=2, max_length=150)
    company_name: str = Field(min_length=2, max_length=150)
    job_description: str = Field(min_length=80, max_length=50_000)
    cv_text: str = Field(min_length=80, max_length=80_000)
    interview_language: Literal["tr", "en"] = "tr"
    consent_ai_processing: Literal[True]

    @field_validator("role_title", "company_name", "job_description", "cv_text", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class InterviewAnswerCreate(BaseModel):
    answer_text: str = Field(min_length=20, max_length=12_000)

    @field_validator("answer_text", mode="before")
    @classmethod
    def strip_answer(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class InterviewQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    difficulty: str
    question: str
    rationale: str
    answer_framework: list[str] = Field(default_factory=list)
    evaluation_criteria: list[str] = Field(default_factory=list)
    order_index: int
    feedback: AnswerFeedback | None = None
    score: int | None = None
    answered_at: datetime | None = None


class InterviewPlanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_title: str
    company_name: str
    status: str
    readiness_score: int
    match_score: int
    question_count: int
    answered_count: int
    created_at: datetime
    updated_at: datetime | None = None


class InterviewPlanResponse(InterviewPlanSummary):
    interview_language: str
    analysis: InterviewAnalysis
    questions: list[InterviewQuestionResponse]


class CvExtractResponse(BaseModel):
    filename: str
    text: str
    character_count: int


class AnswerEvaluationResponse(BaseModel):
    question_id: int
    score: int
    readiness_score: int
    feedback: AnswerFeedback
