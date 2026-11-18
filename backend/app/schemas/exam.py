from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.schemas.question import QuestionResponse

class ExamCreate(BaseModel):
    title: str
    subject: str
    department: Optional[str] = "Computer Science & Engineering"
    class_name: Optional[str] = "B.Tech CS"
    section: Optional[str] = "Section A"
    academic_year: Optional[str] = "2026-2027"
    exam_type: Optional[str] = "Internal Assessment"
    exam_date: Optional[str] = None
    duration_minutes: Optional[int] = 90
    total_marks: float = 50.0
    passing_marks: Optional[float] = 20.0
    instructions: Optional[str] = "Answer all questions. Handwriting should be legible. Diagrams where necessary."

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None
    exam_type: Optional[str] = None
    exam_date: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    instructions: Optional[str] = None
    status: Optional[str] = None

class ExamResponse(ExamCreate):
    id: str
    teacher_id: str
    status: str
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    questions_count: Optional[int] = 0
    scripts_count: Optional[int] = 0
    evaluated_count: Optional[int] = 0
    approved_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ExamDetailResponse(ExamResponse):
    questions: List[QuestionResponse] = []
