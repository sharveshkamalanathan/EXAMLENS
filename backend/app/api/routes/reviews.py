from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_teacher
from app.models.user import User
from app.models.evaluation import Evaluation, TeacherReview
from app.models.script import AnswerScript
from app.models.audit import AuditLog
from app.schemas.evaluation import TeacherReviewCreate, TeacherReviewResponse
from app.services.review_service import record_teacher_override

router = APIRouter(tags=["Teacher Review & Overrides"])

@router.post("/evaluations/{evaluation_id}/override", response_model=TeacherReviewResponse)
def override_ai_evaluation(
    evaluation_id: str,
    review_in: TeacherReviewCreate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    ev = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    if ev.submission.script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if review_in.final_marks < 0 or review_in.final_marks > ev.maximum_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Awarded marks must be between 0.0 and {ev.maximum_marks}."
        )

    review = record_teacher_override(db, evaluation_id, current_teacher.id, review_in)
    
    resp = TeacherReviewResponse.model_validate(review)
    resp.teacher_name = current_teacher.full_name
    return resp

@router.post("/evaluations/{evaluation_id}/approve", response_model=TeacherReviewResponse)
def approve_ai_evaluation(
    evaluation_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    ev = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    if ev.submission.script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Approve existing marks
    review_in = TeacherReviewCreate(
        final_marks=ev.original_ai_marks,
        override_reason="AI marks approved as fair and accurate by teacher.",
        status="approved"
    )
    review = record_teacher_override(db, evaluation_id, current_teacher.id, review_in)
    
    resp = TeacherReviewResponse.model_validate(review)
    resp.teacher_name = current_teacher.full_name
    return resp

@router.post("/scripts/{script_id}/approve-all")
def approve_entire_script(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    for sub in script.submissions:
        if sub.evaluations:
            latest_eval = sub.evaluations[-1]
            if not latest_eval.reviews:
                record_teacher_override(
                    db,
                    latest_eval.id,
                    current_teacher.id,
                    TeacherReviewCreate(
                        final_marks=latest_eval.original_ai_marks,
                        override_reason="Teacher batch approved.",
                        status="approved"
                    )
                )

    script.is_approved = True
    script.processing_status = "teacher_approved"
    db.commit()

    return {"message": "Entire answer script approved", "script_id": script.id, "total_score": script.total_score}

@router.get("/evaluations/{evaluation_id}/audit")
def get_evaluation_audit(
    evaluation_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    ev = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == "evaluation",
        AuditLog.entity_id == evaluation_id
    ).order_by(AuditLog.created_at.desc()).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "user_name": l.user.full_name if l.user else "System",
            "previous_data": l.previous_data,
            "new_data": l.new_data,
            "created_at": l.created_at
        }
        for l in logs
    ]
