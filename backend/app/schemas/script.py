from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

class ScriptPageResponse(BaseModel):
    id: str
    page_number: int
    original_image_path: str
    processed_image_path: Optional[str] = None
    preprocessing_status: str

    class Config:
        from_attributes = True

class OCRLineWord(BaseModel):
    text: str
    confidence: Optional[float] = None
    bounding_box: Optional[List[float]] = None  # [x, y, width, height]

class OCRLine(BaseModel):
    text: str
    confidence: Optional[float] = None
    bounding_box: Optional[List[float]] = None
    words: List[OCRLineWord] = []

class OCRResultResponse(BaseModel):
    id: str
    script_page_id: str
    provider: str
    extracted_text: str
    structured_output: Dict[str, Any] = {}
    processing_time_ms: int
    confidence: Optional[float] = None
    status: str

    class Config:
        from_attributes = True

class ExtractedAnswerResponse(BaseModel):
    id: str
    answer_script_id: str
    question_id: str
    question_number: Optional[str] = None
    question_text: Optional[str] = None
    max_marks: Optional[float] = None
    page_references: Optional[str] = "1"
    original_ocr_text: str
    corrected_text: Optional[str] = None
    final_text: str
    segmentation_confidence: Optional[float] = None
    verification_status: str  # unverified, verified, corrected, blank, unreadable

    class Config:
        from_attributes = True

class ExtractedAnswerUpdate(BaseModel):
    corrected_text: Optional[str] = None
    question_id: Optional[str] = None
    verification_status: Optional[str] = None

class AnswerScriptResponse(BaseModel):
    id: str
    exam_id: str
    student_id: Optional[str] = None
    student_roll_no: str
    student_name: Optional[str] = None
    batch_id: Optional[str] = None
    original_file_name: str
    file_type: str
    page_count: int
    upload_status: str
    processing_status: str
    total_score: Optional[float] = None
    is_approved: bool
    uploaded_at: datetime
    created_at: datetime
    pages: List[ScriptPageResponse] = []

    class Config:
        from_attributes = True

class AnswerScriptDetailResponse(AnswerScriptResponse):
    extracted_answers: List[ExtractedAnswerResponse] = []
    ocr_results: List[OCRResultResponse] = []

class BatchUploadResponse(BaseModel):
    id: str
    exam_id: str
    batch_name: str
    total_files: int
    status: str
    created_at: datetime
    scripts: List[AnswerScriptResponse] = []

    class Config:
        from_attributes = True
