from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.script import ScriptPageResponse

class CriterionEvaluationSchema(BaseModel):
    criterion_name: str
    criterion_id: Optional[str] = None
    maximum_marks: float = 1.0
    awarded_marks: float = 0.0
    explanation: str
    evidence: Optional[str] = ""
    missing_concepts: List[str] = Field(default_factory=list)
    incorrect_concepts: List[str] = Field(default_factory=list)
    confidence: Optional[float] = 0.9

class AIEvaluationOutput(BaseModel):
    criteria: List[CriterionEvaluationSchema] = Field(default_factory=list)
    correct_concepts: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    incorrect_statements: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    overall_feedback: str = ""
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    requires_human_review: bool = False
    review_reason: Optional[str] = None

class TeacherReviewCreate(BaseModel):
    final_marks: float
    override_reason: Optional[str] = None
    teacher_comments: Optional[str] = None
    status: str = "approved"  # approved, overridden, rejected

class TeacherReviewResponse(BaseModel):
    id: str
    evaluation_id: str
    teacher_id: str
    teacher_name: Optional[str] = None
    original_ai_marks: float
    final_marks: float
    override_reason: Optional[str] = None
    teacher_comments: Optional[str] = None
    status: str
    reviewed_at: datetime

    class Config:
        from_attributes = True

class CriterionEvaluationResponse(BaseModel):
    id: str
    criterion_id: str
    criterion_name: Optional[str] = None
    maximum_marks: float
    awarded_marks: float
    explanation: str
    evidence: Optional[str] = None
    missing_concepts: List[str] = []
    incorrect_concepts: List[str] = []
    confidence: Optional[float] = None

    class Config:
        from_attributes = True

class EvaluationDetailResponse(BaseModel):
    id: str
    submission_id: str
    question_id: str
    question_number: str
    question_text: str
    max_marks: float
    student_roll_no: str
    student_name: Optional[str] = None
    student_answer: str
    original_ocr_text: Optional[str] = None
    corrected_text: Optional[str] = None
    original_ai_marks: float
    maximum_marks: float
    effective_marks: float
    ai_feedback: Optional[str] = None
    confidence: Optional[float] = None
    requires_human_review: bool
    review_reason: Optional[str] = None
    provider: str
    status: str
    evaluated_at: datetime
    execution_time_ms: int
    criteria_evaluations: List[CriterionEvaluationResponse] = []
    latest_review: Optional[TeacherReviewResponse] = None

    class Config:
        from_attributes = True

class ScriptEvaluationSummary(BaseModel):
    script_id: str
    student_roll_no: str
    student_name: Optional[str] = None
    exam_id: str
    exam_title: str
    total_score: float
    max_total_marks: float
    percentage: float
    is_approved: bool
    status: str
    pages: List[ScriptPageResponse] = []
    evaluations: List[EvaluationDetailResponse] = []
