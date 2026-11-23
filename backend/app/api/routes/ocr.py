import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.core.deps import get_current_teacher
from app.models.user import User
from app.models.script import AnswerScript, ScriptPage, OCRResult, ExtractedAnswer, Submission
from app.models.question import Question
from app.schemas.script import (
    OCRResultResponse,
    ExtractedAnswerResponse,
    ExtractedAnswerUpdate
)
from app.services.ocr.service import process_page_ocr
from app.services.answer_segmentation import segment_text_by_questions
from app.services.image_preprocessing import convert_pdf_to_images, preprocess_page_image

router = APIRouter(tags=["OCR & Handwriting Recognition"])

@router.post("/scripts/{script_id}/process-ocr")
def run_script_ocr(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    script.processing_status = "ocr_processing"
    db.commit()

    # If pages are missing or incomplete, auto-regenerate from the stored file
    if (not script.pages or len(script.pages) == 0) and script.stored_file_path:
        clean_stored = script.stored_file_path.replace("/storage/", "").lstrip("/\\")
        stored_disk = os.path.join(settings.STORAGE_DIR, clean_stored)
        if os.path.exists(stored_disk):
            pages_output_dir = os.path.join(settings.PROCESSED_DIR, script.id)
            page_paths = convert_pdf_to_images(stored_disk, pages_output_dir)
            script.page_count = len(page_paths)
            for idx, p_path in enumerate(page_paths):
                enhanced_path = os.path.join(pages_output_dir, f"enhanced_{idx + 1}.jpg")
                preprocess_page_image(p_path, enhanced_path)
                sp = ScriptPage(
                    answer_script_id=script.id,
                    page_number=idx + 1,
                    original_image_path=f"/storage/processed/{script.id}/page_{idx + 1}.jpg",
                    processed_image_path=f"/storage/processed/{script.id}/enhanced_{idx + 1}.jpg",
                    preprocessing_status="enhanced"
                )
                db.add(sp)
            db.commit()
            db.refresh(script)

    all_page_texts = []
    has_low_conf = False

    # Clear prior OCRResult records for these pages to prevent duplication
    for page in script.pages:
        db.query(OCRResult).filter(OCRResult.script_page_id == page.id).delete()
    db.commit()

    # Process each page
    for page in script.pages:
        # Determine image path on disk
        target_path = page.processed_image_path or page.original_image_path or ""
        clean_rel = target_path.replace("/storage/", "").lstrip("/\\")
        
        candidates = [
            os.path.join(settings.STORAGE_DIR, clean_rel),
            os.path.join(settings.PROCESSED_DIR, script.id, os.path.basename(target_path)),
            os.path.join(settings.PROCESSED_DIR, os.path.basename(target_path)),
            os.path.join(settings.PROCESSED_DIR, script.id, f"page_{page.page_number}.jpg"),
            os.path.join(settings.PROCESSED_DIR, f"scan_{script.student_roll_no}.jpg")
        ]
        
        img_disk_path = None
        for cand in candidates:
            if os.path.exists(cand) and os.path.getsize(cand) > 0:
                img_disk_path = cand
                break
                
        if not img_disk_path:
            img_disk_path = os.path.join(settings.PROCESSED_DIR, script.id, f"page_{page.page_number}.jpg")

        # Run OCR
        ocr_data = process_page_ocr(img_disk_path, page.page_number)
        
        # Save OCR Result
        ocr_rec = OCRResult(
            script_page_id=page.id,
            provider=ocr_data.provider,
            extracted_text=ocr_data.extracted_text,
            structured_output_json=ocr_data.model_dump_json(),
            processing_time_ms=ocr_data.processing_time_ms,
            confidence=ocr_data.confidence,
            status="completed"
        )
        db.add(ocr_rec)
        all_page_texts.append(ocr_data.extracted_text)
        
        if ocr_data.confidence < 0.80:
            has_low_conf = True

    combined_text = "\n\n".join(t for t in all_page_texts if t.strip())

    # Check for direct digital text extracted from DOCX / digital PDF upload
    pages_output_dir = os.path.join(settings.PROCESSED_DIR, script.id)
    digital_text_file = os.path.join(pages_output_dir, "full_digital_text.txt")
    if os.path.exists(digital_text_file) and os.path.getsize(digital_text_file) > 10:
        try:
            with open(digital_text_file, "r", encoding="utf-8", errors="ignore") as f:
                digital_content = f.read().strip()
                if len(digital_content) > len(combined_text):
                    combined_text = digital_content
                    has_low_conf = False
        except Exception:
            pass

    # Ensure questions exist for the exam; if none created yet, auto-discover and provision them!
    questions = db.query(Question).filter(Question.exam_id == script.exam_id).order_by(Question.display_order).all()
    if not questions:
        from app.services.answer_segmentation import auto_discover_questions_from_text
        discovered = auto_discover_questions_from_text(combined_text)
        if not discovered:
            discovered = [{
                "question_number": "Q1",
                "prompt_text": f"Curriculum Assessment Question 1 ({script.exam.title})",
                "text": combined_text.strip() or "General Answer Submission",
                "confidence": 0.88
            }]
        for idx, disc in enumerate(discovered, 1):
            new_q = Question(
                exam_id=script.exam_id,
                question_number=disc["question_number"],
                text=disc["prompt_text"] if len(disc["prompt_text"]) > 5 else f"Exam Question {idx}",
                question_type="descriptive",
                max_marks=round(float(script.exam.total_marks or 50.0) / max(1, len(discovered)), 1),
                reference_answer=disc["text"],
                display_order=idx
            )
            db.add(new_q)
            db.flush()
            questions.append(new_q)
        db.commit()

    # Intelligent question & subtopic segmentation
    segmented = segment_text_by_questions(combined_text, questions)

    # Delete any prior extracted answers
    db.query(ExtractedAnswer).filter(ExtractedAnswer.answer_script_id == script.id).delete()

    for seg in segmented:
        ext_ans = ExtractedAnswer(
            answer_script_id=script.id,
            question_id=seg["question_id"],
            page_references="1",
            original_ocr_text=seg["text"],
            corrected_text=None,
            segmentation_confidence=seg["confidence"],
            verification_status="unverified"
        )
        db.add(ext_ans)

    script.processing_status = "ocr_verification_required" if has_low_conf else "ocr_completed"
    db.commit()
    db.refresh(script)

    return {
        "message": "Handwriting OCR completed successfully",
        "script_id": script.id,
        "processing_status": script.processing_status,
        "segmented_answers_count": len(segmented),
        "requires_verification": has_low_conf
    }

@router.get("/scripts/{script_id}/ocr", response_model=List[OCRResultResponse])
def get_script_ocr_results(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    results = []
    for p in script.pages:
        for r in p.ocr_results:
            results.append(r)
    return results

@router.put("/answers/{answer_id}", response_model=ExtractedAnswerResponse)
def update_extracted_answer(
    answer_id: str,
    ans_in: ExtractedAnswerUpdate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    answer = db.query(ExtractedAnswer).filter(ExtractedAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Extracted answer not found")
    if answer.script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if ans_in.corrected_text is not None:
        answer.corrected_text = ans_in.corrected_text
        answer.verification_status = "corrected"
    if ans_in.question_id is not None:
        answer.question_id = ans_in.question_id
    if ans_in.verification_status is not None:
        answer.verification_status = ans_in.verification_status

    db.commit()
    db.refresh(answer)
    return answer

@router.post("/scripts/{script_id}/ocr/verify")
def verify_script_ocr(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Teacher confirms extracted OCR text.
    Promotes extracted answers into official Submission records ready for AI Evaluation.
    """
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    for ans in script.extracted_answers:
        ans.verification_status = "verified" if ans.verification_status != "corrected" else "corrected"
        ans.verified_by = current_teacher.id
        ans.verified_at = datetime.now(timezone.utc)

        # Create or update Submission
        existing_sub = db.query(Submission).filter(
            Submission.answer_script_id == script.id,
            Submission.question_id == ans.question_id
        ).first()

        final_content = ans.corrected_text if ans.corrected_text is not None else ans.original_ocr_text

        if existing_sub:
            existing_sub.student_answer = final_content
            existing_sub.verification_status = ans.verification_status
            existing_sub.updated_at = datetime.now(timezone.utc)
        else:
            new_sub = Submission(
                answer_script_id=script.id,
                question_id=ans.question_id,
                student_answer=final_content,
                verification_status=ans.verification_status
            )
            db.add(new_sub)

    script.processing_status = "ready_for_evaluation"
    db.commit()
    return {"message": "OCR verified and answers prepared for AI evaluation", "status": script.processing_status}
