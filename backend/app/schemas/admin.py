from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class UserSummary(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    institution: Optional[str] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    created_at: datetime
    exams_count: int = 0
    scripts_count: int = 0

    class Config:
        from_attributes = True

class AdminDashboardAnalytics(BaseModel):
    total_users: int
    total_teachers: int
    total_students: int
    total_admins: int
    total_exams: int
    total_scripts: int
    total_pages_processed: int
    total_evaluations: int
    avg_score: float
    total_unread_messages: int
    total_messages: int
    storage_used_mb: float
    recent_users: List[UserSummary]
    recent_messages: List[Dict[str, Any]]
