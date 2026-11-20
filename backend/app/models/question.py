import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_question_id = Column(String(36), ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    question_number = Column(String(20), nullable=False)  # "Q1", "Q2(a)", "2(b)"
    text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="descriptive")  # descriptive, short_answer, explain, compare, define
    max_marks = Column(Float, nullable=False, default=5.0)
    topic = Column(String(100), nullable=True, default="General")
    difficulty = Column(String(20), nullable=False, default="medium")  # easy, medium, hard
    reference_answer = Column(Text, nullable=False)
    important_concepts_json = Column(Text, nullable=True, default="[]")
    alternative_explanations_json = Column(Text, nullable=True, default="[]")
    optional_keywords_json = Column(Text, nullable=True, default="[]")
    display_order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    exam = relationship("Exam", back_populates="questions")
    rubric_criteria = relationship("RubricCriterion", back_populates="question", cascade="all, delete-orphan", order_by="RubricCriterion.display_order")
    subquestions = relationship("Question", backref="parent_question", remote_side=[id])
    extracted_answers = relationship("ExtractedAnswer", back_populates="question")
    submissions = relationship("Submission", back_populates="question")

    @property
    def important_concepts(self):
        try:
            return json.loads(self.important_concepts_json or "[]")
        except Exception:
            return []

    @important_concepts.setter
    def important_concepts(self, val):
        self.important_concepts_json = json.dumps(val or [])

    @property
    def alternative_explanations(self):
        try:
            return json.loads(self.alternative_explanations_json or "[]")
        except Exception:
            return []

    @property
    def optional_keywords(self):
        try:
            return json.loads(self.optional_keywords_json or "[]")
        except Exception:
            return []

class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    expected_concepts_json = Column(Text, nullable=True, default="[]")
    max_marks = Column(Float, nullable=False, default=1.0)
    scoring_instructions = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    question = relationship("Question", back_populates="rubric_criteria")
    criterion_evaluations = relationship("CriterionEvaluation", back_populates="criterion")

    @property
    def expected_concepts(self):
        try:
            return json.loads(self.expected_concepts_json or "[]")
        except Exception:
            return []

    @expected_concepts.setter
    def expected_concepts(self, val):
        self.expected_concepts_json = json.dumps(val or [])
