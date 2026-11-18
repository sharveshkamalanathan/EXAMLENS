from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class TeacherDashboardStats(BaseModel):
    total_exams: int
    total_scripts: int
    scripts_awaiting_ocr: int
    scripts_awaiting_eval: int
    evaluations_requiring_review: int
    approved_scripts: int
    published_results: int

class ScoreDistributionBucket(BaseModel):
    range_label: str  # "0-20%", "21-40%", "41-60%", "61-80%", "81-100%"
    count: int

class QuestionPerformance(BaseModel):
    question_id: str
    question_number: str
    topic: str
    max_marks: float
    average_marks: float
    average_percentage: float
    difficulty: str
    most_missed_concepts: List[str] = []

class TopicPerformance(BaseModel):
    topic: str
    average_percentage: float
    question_count: int

class ExamAnalyticsResponse(BaseModel):
    exam_id: str
    exam_title: str
    total_students: int
    evaluated_students: int
    approved_students: int
    average_score: float
    highest_score: float
    lowest_score: float
    median_score: float
    pass_percentage: float
    score_distribution: List[ScoreDistributionBucket]
    question_performance: List[QuestionPerformance]
    topic_performance: List[TopicPerformance]
    top_missed_concepts: List[str]
    is_published: bool

class StudentExamResultResponse(BaseModel):
    exam_id: str
    exam_title: str
    subject: str
    exam_date: Optional[str]
    total_marks: float
    student_score: float
    percentage: float
    passed: bool
    rank: Optional[int] = None
    total_students: int
    published_at: Optional[datetime] = None
    question_results: List[Dict[str, Any]] = []
    teacher_overall_comment: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommended_topics: List[str] = []

class StudentAnalyticsResponse(BaseModel):
    student_id: str
    student_roll_no: str
    student_name: str
    total_exams_taken: int
    overall_average_percentage: float
    performance_trends: List[Dict[str, Any]] = []
    strong_topics: List[str] = []
    weak_topics: List[str] = []
    missed_concepts: List[str] = []
    recent_results: List[StudentExamResultResponse] = []

class PublishSummary(BaseModel):
    exam_id: str
    total_students: int
    evaluated_count: int
    approved_count: int
    pending_review_count: int
    can_publish: bool
    warnings: List[str] = []
