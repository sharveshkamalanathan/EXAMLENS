import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.core.config import settings
from app.core.deps import get_current_admin
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.script import AnswerScript, ScriptPage
from app.models.evaluation import Evaluation
from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageResponse, ContactMessageStatusUpdate
from app.schemas.admin import AdminDashboardAnalytics, UserSummary

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.get("/analytics", response_model=AdminDashboardAnalytics)
def get_admin_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full platform analytics, user engagement stats, storage usage,
    and recent contact inquiries for the admin dashboard.
    """
    total_users = db.query(User).count()
    total_teachers = db.query(User).filter(User.role == UserRole.TEACHER).count()
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    total_admins = db.query(User).filter(User.role == UserRole.ADMIN).count()
    
    total_exams = db.query(Exam).count()
    total_scripts = db.query(AnswerScript).count()
    total_pages = db.query(ScriptPage).count()
    total_evals = db.query(Evaluation).count()

    # Calculate average score across evaluations
    avg_score_res = db.query(func.avg(Evaluation.total_score)).scalar()
    avg_score = round(float(avg_score_res), 2) if avg_score_res is not None else 0.0

    # Contact messages stats
    total_messages = db.query(ContactMessage).count()
    unread_messages = db.query(ContactMessage).filter(ContactMessage.status == "unread").count()

    # Calculate approximate storage size of storage directory
    storage_size_bytes = 0
    if os.path.exists(settings.STORAGE_DIR):
        for root, _, files in os.walk(settings.STORAGE_DIR):
            for f in files:
                try:
                    fp = os.path.join(root, f)
                    storage_size_bytes += os.path.getsize(fp)
                except Exception:
                    pass
    storage_mb = round(storage_size_bytes / (1024 * 1024), 2)

    # Fetch recent users with their activity metrics
    users = db.query(User).order_by(User.created_at.desc()).limit(25).all()
    recent_user_summaries = []
    for u in users:
        exams_c = db.query(Exam).filter(Exam.teacher_id == u.id).count() if u.role in [UserRole.TEACHER, UserRole.ADMIN] else 0
        scripts_c = db.query(AnswerScript).filter(AnswerScript.student_id == u.id).count() if u.role == UserRole.STUDENT else 0
        recent_user_summaries.append(UserSummary(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            institution=u.institution,
            department=u.department,
            roll_number=u.roll_number,
            created_at=u.created_at,
            exams_count=exams_c,
            scripts_count=scripts_c
        ))

    # Fetch recent messages
    recent_msgs = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(15).all()
    recent_msg_dicts = [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "subject": m.subject,
            "message": m.message,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "replied_at": m.replied_at.isoformat() if m.replied_at else None
        }
        for m in recent_msgs
    ]

    return AdminDashboardAnalytics(
        total_users=total_users,
        total_teachers=total_teachers,
        total_students=total_students,
        total_admins=total_admins,
        total_exams=total_exams,
        total_scripts=total_scripts,
        total_pages_processed=total_pages,
        total_evaluations=total_evals,
        avg_score=avg_score,
        total_unread_messages=unread_messages,
        total_messages=total_messages,
        storage_used_mb=storage_mb,
        recent_users=recent_user_summaries,
        recent_messages=recent_msg_dicts
    )

@router.get("/users", response_model=List[UserSummary])
def list_all_users(
    role: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists all registered users on ExamLens with usage stats."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    users = query.order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        exams_c = db.query(Exam).filter(Exam.teacher_id == u.id).count() if u.role in [UserRole.TEACHER, UserRole.ADMIN] else 0
        scripts_c = db.query(AnswerScript).filter(AnswerScript.student_id == u.id).count() if u.role == UserRole.STUDENT else 0
        results.append(UserSummary(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            institution=u.institution,
            department=u.department,
            roll_number=u.roll_number,
            created_at=u.created_at,
            exams_count=exams_c,
            scripts_count=scripts_c
        ))
    return results

@router.get("/messages", response_model=List[ContactMessageResponse])
def get_contact_messages(
    status: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists customer contact messages received via landing page."""
    query = db.query(ContactMessage)
    if status:
        query = query.filter(ContactMessage.status == status)
    return query.order_by(ContactMessage.created_at.desc()).all()

@router.patch("/messages/{message_id}", response_model=ContactMessageResponse)
def update_message_status(
    message_id: str,
    payload: ContactMessageStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Updates a contact message status (e.g. read, replied, archived)."""
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.status = payload.status
    if payload.status == "replied":
        msg.replied_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/messages/{message_id}")
def delete_contact_message(
    message_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deletes a contact inquiry message."""
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"message": "Message deleted successfully"}

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_by_admin(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Permanently delete a user account and their associated records (admin privilege)."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own active administrator account from the user directory. Use Account Settings Danger Zone."
        )

    from app.api.routes.auth import delete_user_cascade
    target_email = target_user.email
    delete_user_cascade(target_user, db)
    return {
        "success": True,
        "message": f"User {target_email} has been permanently deleted.",
        "deleted_user_id": user_id
    }
