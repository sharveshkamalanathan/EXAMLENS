from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_teacher
from app.models.user import User
from app.models.script import UploadBatch, AnswerScript
from app.schemas.script import BatchUploadResponse

router = APIRouter(prefix="/batches", tags=["Batch Processing"])

@router.get("", response_model=List[BatchUploadResponse])
def get_batches(
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    batches = db.query(UploadBatch).filter(UploadBatch.teacher_id == current_teacher.id).order_by(UploadBatch.created_at.desc()).all()
    return batches

@router.get("/{batch_id}", response_model=BatchUploadResponse)
def get_batch_detail(
    batch_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    batch = db.query(UploadBatch).filter(UploadBatch.id == batch_id, UploadBatch.teacher_id == current_teacher.id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch
