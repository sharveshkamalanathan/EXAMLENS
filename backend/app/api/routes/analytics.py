from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_user, get_current_teacher, get_current_student
from app.models.user import User
from app.models.exam import Exam
from app.models.script import AnswerScript
from app.models.evaluation import Evaluation
from app.schemas.analytics import (
    TeacherDashboardStats,
    ExamAnalyticsResponse,
    StudentAnalyticsResponse
)
from app.services.analytics_service import compute_exam_analytics, generate_exam_results_csv

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/teacher", response_model=TeacherDashboardStats)
def get_teacher_stats(
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    teacher_exams = db.query(Exam).filter(Exam.teacher_id == current_teacher.id).all()
    exam_ids = [e.id for e in teacher_exams]

    scripts = db.query(AnswerScript).filter(AnswerScript.exam_id.in_(exam_ids)).all() if exam_ids else []

    awaiting_ocr = len([s for s in scripts if s.processing_status in ["uploaded", "ready_for_ocr", "ocr_processing"]])
    awaiting_eval = len([s for s in scripts if s.processing_status in ["ocr_completed", "ready_for_evaluation"]])
    review_req = len([s for s in scripts if s.processing_status == "review_required" or (not s.is_approved and s.total_score is not None)])
    approved = len([s for s in scripts if s.is_approved])
    published = len([e for e in teacher_exams if e.is_published])

    return TeacherDashboardStats(
        total_exams=len(teacher_exams),
        total_scripts=len(scripts),
        scripts_awaiting_ocr=awaiting_ocr,
        scripts_awaiting_eval=awaiting_eval,
        evaluations_requiring_review=review_req,
        approved_scripts=approved,
        published_results=published
    )

@router.get("/exam/{exam_id}", response_model=ExamAnalyticsResponse)
def get_exam_analytics(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return compute_exam_analytics(db, exam_id)

@router.get("/exam/{exam_id}/export-csv")
def export_exam_csv(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    import re
    csv_data = generate_exam_results_csv(db, exam_id)
    safe_title = re.sub(r'[^a-zA-Z0-9_\-]', '_', exam.title)
    filename = f"{safe_title}_Results.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/student", response_model=StudentAnalyticsResponse)
def get_student_analytics(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    scripts = db.query(AnswerScript).join(Exam).filter(
        AnswerScript.student_id == current_student.id,
        Exam.is_published == True
    ).all()

    percentages = []
    trends = []
    strong = []
    weak = []
    missed = []

    for s in scripts:
        if s.total_score is not None and s.exam.total_marks > 0:
            pct = round((s.total_score / s.exam.total_marks) * 100, 1)
            percentages.append(pct)
            trends.append({
                "exam_title": s.exam.title,
                "subject": s.exam.subject,
                "date": s.exam.exam_date,
                "percentage": pct
            })
            if pct >= 75:
                strong.append(s.exam.subject)
            else:
                weak.append(s.exam.subject)

    overall_avg = round(sum(percentages) / len(percentages), 1) if percentages else 0.0

    return StudentAnalyticsResponse(
        student_id=current_student.id,
        student_roll_no=current_student.roll_number or "STU",
        student_name=current_student.full_name,
        total_exams_taken=len(scripts),
        overall_average_percentage=overall_avg,
        performance_trends=trends,
        strong_topics=list(dict.fromkeys(strong)),
        weak_topics=list(dict.fromkeys(weak)),
        missed_concepts=missed,
        recent_results=[]
    )
