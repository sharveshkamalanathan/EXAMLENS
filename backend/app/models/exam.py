import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True, default="Computer Science & Engineering")
    class_name = Column(String(100), nullable=True, default="B.Tech CS")
    section = Column(String(50), nullable=True, default="Section A")
    academic_year = Column(String(50), nullable=True, default="2026-2027")
    exam_type = Column(String(100), nullable=True, default="Internal Assessment 2")
    exam_date = Column(String(50), nullable=True)
    duration_minutes = Column(Integer, nullable=True, default=90)
    total_marks = Column(Float, nullable=False, default=50.0)
    passing_marks = Column(Float, nullable=True, default=20.0)
    instructions = Column(Text, nullable=True)
    question_paper_file = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="draft")
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    teacher = relationship("User", back_populates="exams")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.display_order")
    scripts = relationship("AnswerScript", back_populates="exam", cascade="all, delete-orphan")
    batches = relationship("UploadBatch", back_populates="exam", cascade="all, delete-orphan")
    enrollments = relationship("ExamEnrollment", back_populates="exam", cascade="all, delete-orphan")
    publications = relationship("ResultPublication", back_populates="exam", cascade="all, delete-orphan")

class ExamEnrollment(Base):
    __tablename__ = "exam_enrollments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_roll_no = Column(String(50), nullable=False)
    enrollment_status = Column(String(50), default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    exam = relationship("Exam", back_populates="enrollments")
    student = relationship("User")
