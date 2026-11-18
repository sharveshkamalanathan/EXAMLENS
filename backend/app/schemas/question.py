from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class RubricCriterionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    expected_concepts: List[str] = Field(default_factory=list)
    max_marks: float = 1.0
    scoring_instructions: Optional[str] = ""
    display_order: int = 1

class RubricCriterionResponse(RubricCriterionCreate):
    id: str
    question_id: str

    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    question_number: str  # "Q1", "Q2(a)", etc.
    parent_question_id: Optional[str] = None
    text: str
    question_type: str = "descriptive"  # descriptive, short_answer, explain, compare, define
    max_marks: float = 5.0
    topic: Optional[str] = "General"
    difficulty: str = "medium"
    reference_answer: str
    important_concepts: List[str] = Field(default_factory=list)
    alternative_explanations: List[str] = Field(default_factory=list)
    optional_keywords: List[str] = Field(default_factory=list)
    display_order: int = 1
    rubric_criteria: List[RubricCriterionCreate] = Field(default_factory=list)

class QuestionUpdate(BaseModel):
    question_number: Optional[str] = None
    text: Optional[str] = None
    question_type: Optional[str] = None
    max_marks: Optional[float] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    reference_answer: Optional[str] = None
    important_concepts: Optional[List[str]] = None
    alternative_explanations: Optional[List[str]] = None
    optional_keywords: Optional[List[str]] = None
    display_order: Optional[int] = None

class QuestionResponse(BaseModel):
    id: str
    exam_id: str
    parent_question_id: Optional[str]
    question_number: str
    text: str
    question_type: str
    max_marks: float
    topic: Optional[str]
    difficulty: str
    reference_answer: str
    important_concepts: List[str]
    alternative_explanations: List[str]
    optional_keywords: List[str]
    display_order: int
    rubric_criteria: List[RubricCriterionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
