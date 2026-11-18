import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database.session import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    original_ai_marks = Column(Float, nullable=False, default=0.0)
    maximum_marks = Column(Float, nullable=False, default=5.0)
    ai_feedback = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True, default=0.90)
    requires_human_review = Column(Boolean, default=False)
    review_reason = Column(String(255), nullable=True)
    provider = Column(String(50), default="mock")  # openai, gemini, mock
    status = Column(String(50), default="completed")  # pending, completed, failed, needs_review
    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    execution_time_ms = Column(Integer, default=0)

    submission = relationship("Submission", back_populates="evaluations")
    criterion_evaluations = relationship("CriterionEvaluation", back_populates="evaluation", cascade="all, delete-orphan")
    reviews = relationship("TeacherReview", back_populates="evaluation", cascade="all, delete-orphan")

    @property
    def latest_review(self):
        if self.reviews:
            return self.reviews[-1]
        return None

    @property
    def effective_marks(self):
        review = self.latest_review
        if review and review.final_marks is not None:
            return review.final_marks
        return self.original_ai_marks

class CriterionEvaluation(Base):
    __tablename__ = "criterion_evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, index=True)
    criterion_id = Column(String(36), ForeignKey("rubric_criteria.id", ondelete="CASCADE"), nullable=False, index=True)
    maximum_marks = Column(Float, nullable=False, default=1.0)
    awarded_marks = Column(Float, nullable=False, default=0.0)
    explanation = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    missing_concepts_json = Column(Text, nullable=True, default="[]")
    incorrect_concepts_json = Column(Text, nullable=True, default="[]")
    confidence = Column(Float, nullable=True, default=0.9)

    evaluation = relationship("Evaluation", back_populates="criterion_evaluations")
    criterion = relationship("RubricCriterion", back_populates="criterion_evaluations")

    @property
    def missing_concepts(self):
        try:
            return json.loads(self.missing_concepts_json or "[]")
        except Exception:
            return []

    @property
    def incorrect_concepts(self):
        try:
            return json.loads(self.incorrect_concepts_json or "[]")
        except Exception:
            return []

class TeacherReview(Base):
    __tablename__ = "teacher_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_ai_marks = Column(Float, nullable=False)
    final_marks = Column(Float, nullable=False)
    override_reason = Column(Text, nullable=True)
    teacher_comments = Column(Text, nullable=True)
    status = Column(String(50), default="approved")  # approved, overridden, rejected
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    evaluation = relationship("Evaluation", back_populates="reviews")
    teacher = relationship("User", back_populates="reviews")

class ResultPublication(Base):
    __tablename__ = "result_publications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="published")  # published, unpublished
    summary_stats_json = Column(Text, nullable=True, default="{}")

    exam = relationship("Exam", back_populates="publications")
    teacher = relationship("User")

    @property
    def summary_stats(self):
        try:
            return json.loads(self.summary_stats_json or "{}")
        except Exception:
            return {}
