import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base

class UserRole(str):
    TEACHER = "teacher"
    STUDENT = "student"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.TEACHER)
    institution = Column(String(255), nullable=True, default="National Institute of Technology")
    department = Column(String(255), nullable=True, default="Computer Science & Engineering")
    roll_number = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    exams = relationship("Exam", back_populates="teacher", cascade="all, delete-orphan")
    scripts = relationship("AnswerScript", back_populates="student")
    reviews = relationship("TeacherReview", back_populates="teacher")
