import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class UploadBatch(Base):
    __tablename__ = "upload_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batch_name = Column(String(255), nullable=False)
    total_files = Column(Integer, default=0)
    status = Column(String(50), default="completed")  # queued, processing, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    exam = relationship("Exam", back_populates="batches")
    scripts = relationship("AnswerScript", back_populates="batch")

class AnswerScript(Base):
    __tablename__ = "answer_scripts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    batch_id = Column(String(36), ForeignKey("upload_batches.id", ondelete="SET NULL"), nullable=True)
    student_roll_no = Column(String(50), nullable=False, index=True)
    student_name = Column(String(255), nullable=True)
    original_file_name = Column(String(255), nullable=False)
    stored_file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, image/jpeg, image/png
    page_count = Column(Integer, default=1)
    upload_status = Column(String(50), default="uploaded")  # uploaded, failed
    processing_status = Column(String(50), default="ready_for_ocr")
    # statuses: uploaded, preprocessing, ocr_processing, ocr_completed,
    # ocr_verification_required, ready_for_evaluation, evaluating,
    # evaluation_completed, review_required, teacher_approved, published, failed
    total_score = Column(Float, nullable=True)
    is_approved = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    exam = relationship("Exam", back_populates="scripts")
    student = relationship("User", back_populates="scripts")
    batch = relationship("UploadBatch", back_populates="scripts")
    pages = relationship("ScriptPage", back_populates="script", cascade="all, delete-orphan", order_by="ScriptPage.page_number")
    extracted_answers = relationship("ExtractedAnswer", back_populates="script", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="script", cascade="all, delete-orphan")

class ScriptPage(Base):
    __tablename__ = "script_pages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_script_id = Column(String(36), ForeignKey("answer_scripts.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False, default=1)
    original_image_path = Column(String(500), nullable=False)
    processed_image_path = Column(String(500), nullable=True)
    preprocessing_status = Column(String(50), default="original")  # original, deskewed, enhanced
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    script = relationship("AnswerScript", back_populates="pages")
    ocr_results = relationship("OCRResult", back_populates="page", cascade="all, delete-orphan")

class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    script_page_id = Column(String(36), ForeignKey("script_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, default="mock")  # mock, azure, google
    extracted_text = Column(Text, nullable=False)
    structured_output_json = Column(Text, nullable=True, default="{}")  # lines, words, bboxes
    processing_time_ms = Column(Integer, default=0)
    confidence = Column(Float, nullable=True, default=0.95)
    status = Column(String(50), default="completed")  # processing, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    page = relationship("ScriptPage", back_populates="ocr_results")

    @property
    def structured_output(self):
        try:
            return json.loads(self.structured_output_json or "{}")
        except Exception:
            return {}

class ExtractedAnswer(Base):
    __tablename__ = "extracted_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_script_id = Column(String(36), ForeignKey("answer_scripts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    page_references = Column(String(100), nullable=True, default="1")
    original_ocr_text = Column(Text, nullable=False)
    corrected_text = Column(Text, nullable=True)
    segmentation_confidence = Column(Float, nullable=True, default=0.9)
    verification_status = Column(String(50), default="unverified")  # unverified, verified, corrected, blank, unreadable
    verified_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    script = relationship("AnswerScript", back_populates="extracted_answers")
    question = relationship("Question", back_populates="extracted_answers")

    @property
    def final_text(self):
        return self.corrected_text if self.corrected_text is not None else self.original_ocr_text

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_script_id = Column(String(36), ForeignKey("answer_scripts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_answer = Column(Text, nullable=False)
    verification_status = Column(String(50), default="verified")  # verified, corrected, unverified
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    script = relationship("AnswerScript", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")
    evaluations = relationship("Evaluation", back_populates="submission", cascade="all, delete-orphan")
