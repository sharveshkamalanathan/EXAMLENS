import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.core.deps import get_current_user, get_current_teacher
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.script import AnswerScript, ScriptPage, UploadBatch, OCRResult, ExtractedAnswer
from app.schemas.script import (
    AnswerScriptResponse,
    AnswerScriptDetailResponse,
    BatchUploadResponse
)
from app.services.image_preprocessing import convert_pdf_to_images, preprocess_page_image
from app.services.ocr.service import process_page_ocr
from app.services.answer_segmentation import segment_text_by_questions

router = APIRouter(tags=["Answer Scripts"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".docx", ".doc"}

@router.post("/exams/{exam_id}/scripts/upload", response_model=AnswerScriptResponse)
async def upload_single_script(
    exam_id: str,
    file: UploadFile = File(...),
    student_roll_no: str = Form(...),
    student_name: Optional[str] = Form(None),
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Check student match by roll number
    matched_student = db.query(User).filter(User.roll_number == student_roll_no).first()

    # Save original file
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}_{file.filename}"
    disk_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process pages
    pages_output_dir = os.path.join(settings.PROCESSED_DIR, file_id)
    page_paths = convert_pdf_to_images(disk_path, pages_output_dir)

    # Create AnswerScript record
    script = AnswerScript(
        id=file_id,
        exam_id=exam.id,
        student_id=matched_student.id if matched_student else None,
        student_roll_no=student_roll_no,
        student_name=student_name or (matched_student.full_name if matched_student else f"Student {student_roll_no}"),
        original_file_name=file.filename or "uploaded_script.pdf",
        stored_file_path=f"/storage/uploads/{stored_name}",
        file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext in [".docx", ".doc"] else ("application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"),
        page_count=len(page_paths),
        upload_status="uploaded",
        processing_status="ready_for_ocr",
        uploaded_at=datetime.now(timezone.utc)
    )
    db.add(script)
    db.commit()

    # Create ScriptPage records & Preprocess
    for idx, p_path in enumerate(page_paths):
        enhanced_path = os.path.join(pages_output_dir, f"enhanced_{idx + 1}.jpg")
        preprocess_page_image(p_path, enhanced_path)
        
        rel_orig = f"/storage/processed/{file_id}/page_{idx + 1}.jpg"
        rel_proc = f"/storage/processed/{file_id}/enhanced_{idx + 1}.jpg"

        script_page = ScriptPage(
            answer_script_id=script.id,
            page_number=idx + 1,
            original_image_path=rel_orig,
            processed_image_path=rel_proc,
            preprocessing_status="enhanced"
        )
        db.add(script_page)

    db.commit()
    db.refresh(script)
    return script

@router.post("/exams/{exam_id}/scripts/batch-upload", response_model=BatchUploadResponse)
async def upload_batch_scripts(
    exam_id: str,
    files: List[UploadFile] = File(...),
    batch_name: str = Form("Batch Upload"),
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    batch = UploadBatch(
        exam_id=exam.id,
        teacher_id=current_teacher.id,
        batch_name=batch_name,
        total_files=len(files),
        status="completed"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    created_scripts = []
    for file in files:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        # Extract roll number from filename if present e.g. STU-1024_exam.pdf
        base = os.path.splitext(file.filename or "")[0]
        roll_guess = base.split('_')[0].split('-')[0].upper()
        if not roll_guess.isalnum():
            roll_guess = f"STU-{uuid.uuid4().hex[:4].upper()}"

        matched_student = db.query(User).filter(User.roll_number == roll_guess).first()

        file_id = str(uuid.uuid4())
        stored_name = f"{file_id}_{file.filename}"
        disk_path = os.path.join(settings.UPLOAD_DIR, stored_name)

        with open(disk_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        pages_output_dir = os.path.join(settings.PROCESSED_DIR, file_id)
        page_paths = convert_pdf_to_images(disk_path, pages_output_dir)

        script = AnswerScript(
            id=file_id,
            exam_id=exam.id,
            student_id=matched_student.id if matched_student else None,
            batch_id=batch.id,
            student_roll_no=roll_guess,
            student_name=matched_student.full_name if matched_student else f"Student {roll_guess}",
            original_file_name=file.filename or "script.pdf",
            stored_file_path=f"/storage/uploads/{stored_name}",
            file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext in [".docx", ".doc"] else ("application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"),
            page_count=len(page_paths),
            upload_status="uploaded",
            processing_status="ready_for_ocr",
            uploaded_at=datetime.now(timezone.utc)
        )
        db.add(script)
        db.commit()

        for idx, p_path in enumerate(page_paths):
            enhanced_path = os.path.join(pages_output_dir, f"enhanced_{idx + 1}.jpg")
            preprocess_page_image(p_path, enhanced_path)
            
            script_page = ScriptPage(
                answer_script_id=script.id,
                page_number=idx + 1,
                original_image_path=f"/storage/processed/{file_id}/page_{idx + 1}.jpg",
                processed_image_path=f"/storage/processed/{file_id}/enhanced_{idx + 1}.jpg",
                preprocessing_status="enhanced"
            )
            db.add(script_page)

        db.commit()
        db.refresh(script)
        created_scripts.append(script)

    return BatchUploadResponse(
        id=batch.id,
        exam_id=exam.id,
        batch_name=batch.batch_name,
        total_files=len(created_scripts),
        status=batch.status,
        created_at=batch.created_at,
        scripts=created_scripts
    )

@router.get("/exams/{exam_id}/scripts", response_model=List[AnswerScriptResponse])
def get_exam_scripts(
    exam_id: str,
    status: Optional[str] = None,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    query = db.query(AnswerScript).filter(AnswerScript.exam_id == exam_id)
    if status:
        query = query.filter(AnswerScript.processing_status == status)
    
    scripts = query.order_by(AnswerScript.student_roll_no.asc()).all()
    return scripts

@router.get("/scripts/{script_id}", response_model=AnswerScriptDetailResponse)
def get_script_detail(
    script_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Answer script not found")

    # Authorization
    if current_user.role == UserRole.STUDENT:
        if script.student_id != current_user.id or not script.exam.is_published:
            raise HTTPException(status_code=403, detail="Unauthorized access to answer script")
    elif current_user.role == UserRole.TEACHER:
        if script.exam.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to answer script")

    # Collect extracted answers with question labels ordered by question display order
    ext_answers = []
    sorted_eas = sorted(
        script.extracted_answers, 
        key=lambda ea: getattr(ea.question, 'display_order', 0) if ea.question else 0
    )
    for ea in sorted_eas:
        ext_answers.append({
            "id": ea.id,
            "answer_script_id": ea.answer_script_id,
            "question_id": ea.question_id,
            "question_number": ea.question.question_number if ea.question else "Q",
            "question_text": ea.question.text if ea.question else "",
            "max_marks": ea.question.max_marks if ea.question else 5.0,
            "page_references": ea.page_references,
            "original_ocr_text": ea.original_ocr_text,
            "corrected_text": ea.corrected_text,
            "final_text": ea.final_text,
            "segmentation_confidence": ea.segmentation_confidence,
            "verification_status": ea.verification_status
        })

    # Collect OCR results across pages
    ocr_list = []
    for page in script.pages:
        for ocr in page.ocr_results:
            ocr_list.append(ocr)

    resp = AnswerScriptDetailResponse.model_validate(script)
    resp.extracted_answers = ext_answers
    resp.ocr_results = ocr_list
    return resp

@router.delete("/scripts/{script_id}")
def delete_script(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(script)
    db.commit()
    return {"message": "Answer script deleted"}
