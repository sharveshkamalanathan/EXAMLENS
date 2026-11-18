from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_user, get_current_teacher
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.evaluation import ResultPublication
from app.models.audit import AuditLog
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, ExamDetailResponse
from app.schemas.analytics import PublishSummary

router = APIRouter(prefix="/exams", tags=["Examinations"])

@router.get("", response_model=List[ExamResponse])
def get_exams(
    subject: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Exam)
    
    # Students only see published exams
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Exam.is_published == True)
    elif current_user.role == UserRole.TEACHER:
        # Teachers see their own exams or all if admin
        query = query.filter(Exam.teacher_id == current_user.id)
    
    if subject:
        query = query.filter(Exam.subject.ilike(f"%{subject}%"))
    if status:
        query = query.filter(Exam.status == status)
    if search:
        query = query.filter(Exam.title.ilike(f"%{search}%") | Exam.subject.ilike(f"%{search}%"))

    exams = query.order_by(Exam.created_at.desc()).all()
    
    # Enrich with counts
    result = []
    for ex in exams:
        item = ExamResponse.model_validate(ex)
        item.questions_count = len(ex.questions)
        item.scripts_count = len(ex.scripts)
        item.evaluated_count = len([s for s in ex.scripts if s.total_score is not None])
        item.approved_count = len([s for s in ex.scripts if s.is_approved])
        result.append(item)
    return result

@router.post("", response_model=ExamResponse)
def create_exam(
    exam_in: ExamCreate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = Exam(
        teacher_id=current_teacher.id,
        title=exam_in.title,
        subject=exam_in.subject,
        department=exam_in.department,
        class_name=exam_in.class_name,
        section=exam_in.section,
        academic_year=exam_in.academic_year,
        exam_type=exam_in.exam_type,
        exam_date=exam_in.exam_date,
        duration_minutes=exam_in.duration_minutes,
        total_marks=exam_in.total_marks,
        passing_marks=exam_in.passing_marks,
        instructions=exam_in.instructions,
        status="draft"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    item = ExamResponse.model_validate(exam)
    item.questions_count = 0
    item.scripts_count = 0
    item.evaluated_count = 0
    item.approved_count = 0
    return item

@router.get("/{exam_id}", response_model=ExamDetailResponse)
def get_exam_detail(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Ownership verification
    if current_user.role == UserRole.STUDENT and not exam.is_published:
        raise HTTPException(status_code=403, detail="Exam results have not been published yet.")
    if current_user.role == UserRole.TEACHER and exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this exam.")

    item = ExamDetailResponse.model_validate(exam)
    item.questions_count = len(exam.questions)
    item.scripts_count = len(exam.scripts)
    item.evaluated_count = len([s for s in exam.scripts if s.total_score is not None])
    item.approved_count = len([s for s in exam.scripts if s.is_approved])
    return item

@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: str,
    exam_in: ExamUpdate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    for field, val in exam_in.model_dump(exclude_unset=True).items():
        setattr(exam, field, val)

    exam.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exam)
    return ExamResponse.model_validate(exam)

@router.delete("/{exam_id}")
def delete_exam(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

@router.get("/{exam_id}/publish-checklist", response_model=PublishSummary)
def get_publish_checklist(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    scripts = exam.scripts
    total = len(scripts)
    evaluated = len([s for s in scripts if s.total_score is not None])
    approved = len([s for s in scripts if s.is_approved])
    pending = total - approved

    warnings = []
    if pending > 0:
        warnings.append(f"{pending} script(s) are awaiting teacher review or approval.")
    if total == 0:
        warnings.append("No answer scripts have been uploaded for this exam.")
    if evaluated < total:
        warnings.append(f"{total - evaluated} script(s) have not been evaluated yet.")

    can_publish = (total > 0 and evaluated == total)

    return PublishSummary(
        exam_id=exam.id,
        total_students=total,
        evaluated_count=evaluated,
        approved_count=approved,
        pending_review_count=pending,
        can_publish=can_publish,
        warnings=warnings
    )

@router.post("/{exam_id}/publish")
def publish_results(
    exam_id: str,
    force: bool = False,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam.is_published = True
    exam.published_at = datetime.now(timezone.utc)
    exam.status = "published"
    
    for s in exam.scripts:
        s.processing_status = "published"

    pub = ResultPublication(
        exam_id=exam.id,
        teacher_id=current_teacher.id,
        status="published",
        published_at=datetime.now(timezone.utc)
    )
    db.add(pub)

    # Audit log
    db.add(AuditLog(
        user_id=current_teacher.id,
        entity_type="exam",
        entity_id=exam.id,
        action="published",
        new_data_json='{"status": "published"}'
    ))
    db.commit()
    return {"message": "Exam results successfully published to students"}

@router.post("/{exam_id}/unpublish")
def unpublish_results(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam.is_published = False
    exam.status = "approved"

    db.add(AuditLog(
        user_id=current_teacher.id,
        entity_type="exam",
        entity_id=exam.id,
        action="unpublished",
        new_data_json='{"status": "unpublished"}'
    ))
    db.commit()
    return {"message": "Exam results unpublished"}
