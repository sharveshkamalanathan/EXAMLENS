import json
import time
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_user, get_current_teacher
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.script import AnswerScript, Submission
from app.models.question import Question
from app.models.evaluation import Evaluation, CriterionEvaluation
from app.schemas.evaluation import EvaluationDetailResponse, ScriptEvaluationSummary
from app.schemas.script import ScriptPageResponse
from app.services.ai.service import get_ai_evaluator

router = APIRouter(tags=["AI Evaluation Engine"])

def _evaluate_single_submission(sub: Submission, db: Session) -> Evaluation:
    # Clear prior evaluations for this submission to avoid duplicate accumulation
    db.query(Evaluation).filter(Evaluation.submission_id == sub.id).delete()
    db.commit()

    evaluator = get_ai_evaluator()
    start_time = time.time()
    
    # Run evaluation
    ai_output = evaluator.evaluate_answer(
        question=sub.question,
        student_answer=sub.student_answer,
        student_roll_no=sub.script.student_roll_no
    )
    exec_ms = int((time.time() - start_time) * 1000)

    # Compute backend total marks
    awarded_sum = sum(c.awarded_marks for c in ai_output.criteria)
    final_ai_marks = min(sub.question.max_marks, round(awarded_sum, 2))

    # Save Evaluation
    evaluation = Evaluation(
        submission_id=sub.id,
        original_ai_marks=final_ai_marks,
        maximum_marks=sub.question.max_marks,
        ai_feedback=ai_output.overall_feedback,
        confidence=ai_output.confidence,
        requires_human_review=ai_output.requires_human_review,
        review_reason=ai_output.review_reason,
        provider=evaluator.provider_name,
        status="completed",
        evaluated_at=datetime.now(timezone.utc),
        execution_time_ms=exec_ms
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    # Save Criterion evaluations
    for c_out in ai_output.criteria:
        crit_id = c_out.criterion_id
        if not crit_id:
            matched_crit = next((c for c in sub.question.rubric_criteria if c.name == c_out.criterion_name), None)
            crit_id = matched_crit.id if matched_crit else sub.question.rubric_criteria[0].id

        crit_eval = CriterionEvaluation(
            evaluation_id=evaluation.id,
            criterion_id=crit_id,
            maximum_marks=c_out.maximum_marks,
            awarded_marks=c_out.awarded_marks,
            explanation=c_out.explanation,
            evidence=c_out.evidence,
            missing_concepts_json=json.dumps(c_out.missing_concepts),
            incorrect_concepts_json=json.dumps(c_out.incorrect_concepts),
            confidence=c_out.confidence
        )
        db.add(crit_eval)

    db.commit()
    db.refresh(evaluation)
    return evaluation

@router.post("/submissions/{submission_id}/evaluate", response_model=EvaluationDetailResponse)
def evaluate_submission(
    submission_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    evaluation = _evaluate_single_submission(sub, db)
    return _build_eval_response(evaluation)

@router.post("/scripts/{script_id}/evaluate", response_model=ScriptEvaluationSummary)
def evaluate_entire_script(
    script_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    if script.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    script.processing_status = "evaluating"
    db.commit()

    # Synchronize and deduplicate submissions from extracted answers
    if script.extracted_answers:
        existing_subs = {s.question_id: s for s in script.submissions if s.question_id}
        # Delete any duplicate submissions with the same question_id
        seen_q = set()
        for s in list(script.submissions):
            if s.question_id in seen_q:
                db.delete(s)
            else:
                seen_q.add(s.question_id)
        db.commit()
        db.refresh(script)

        # Create or update 1:1 submission for each extracted answer
        for ea in script.extracted_answers:
            text = ea.corrected_text if ea.corrected_text is not None else ea.original_ocr_text
            sub = existing_subs.get(ea.question_id)
            if sub:
                sub.student_answer = text
                sub.verification_status = "verified"
            else:
                db.add(Submission(
                    answer_script_id=script.id,
                    question_id=ea.question_id,
                    student_answer=text,
                    verification_status="verified"
                ))
        db.commit()
        db.refresh(script)

    question_scores = {}
    needs_review = False

    for sub in script.submissions:
        if not sub.question_id or sub.question_id in question_scores:
            continue
        # Evaluate each submission
        ev = _evaluate_single_submission(sub, db)
        question_scores[sub.question_id] = ev.effective_marks
        if ev.requires_human_review:
            needs_review = True

    script.total_score = round(sum(question_scores.values()), 2)
    script.processing_status = "review_required" if needs_review else "evaluation_completed"
    db.commit()
    db.refresh(script)

    return get_script_evaluation(script_id, current_teacher, db)

@router.post("/exams/{exam_id}/batch-evaluate")
def batch_evaluate_exam(
    exam_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    scripts = db.query(AnswerScript).filter(
        AnswerScript.exam_id == exam_id,
        AnswerScript.processing_status.in_(["ready_for_evaluation", "ocr_completed", "review_required", "evaluation_completed"])
    ).all()

    evaluated_count = 0
    for s in scripts:
        evaluate_entire_script(s.id, current_teacher, db)
        evaluated_count += 1

    exam.status = "review_pending"
    db.commit()

    return {
        "message": f"Successfully evaluated {evaluated_count} answer scripts using AI.",
        "exam_id": exam.id,
        "evaluated_count": evaluated_count
    }

@router.get("/scripts/{script_id}/evaluation", response_model=ScriptEvaluationSummary)
def get_script_evaluation(
    script_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    script = db.query(AnswerScript).filter(AnswerScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    if current_user.role == UserRole.STUDENT:
        if script.student_id != current_user.id or not script.exam.is_published:
            raise HTTPException(status_code=403, detail="Unauthorized")
    elif current_user.role == UserRole.TEACHER:
        if script.exam.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")

    eval_items = []
    seen_q = set()
    sorted_subs = sorted(
        script.submissions,
        key=lambda s: getattr(s.question, 'display_order', 0) if s.question else 0
    )
    for sub in sorted_subs:
        if not sub.question_id or sub.question_id in seen_q:
            continue
        if sub.evaluations:
            latest_eval = sorted(sub.evaluations, key=lambda e: e.evaluated_at or datetime.min)[-1]
            eval_items.append(_build_eval_response(latest_eval))
            seen_q.add(sub.question_id)

    # Ensure total_score and percentage strictly match the live sum of all question effective marks
    live_tot = round(sum(item.effective_marks for item in eval_items), 2)
    script.total_score = live_tot
    db.commit()

    tot_score = live_tot
    max_tot = script.exam.total_marks or 50.0
    pct = round((tot_score / max_tot) * 100, 1) if max_tot > 0 else 0.0

    return ScriptEvaluationSummary(
        script_id=script.id,
        student_roll_no=script.student_roll_no,
        student_name=script.student_name,
        exam_id=script.exam.id,
        exam_title=script.exam.title,
        total_score=tot_score,
        max_total_marks=max_tot,
        percentage=pct,
        is_approved=script.is_approved,
        status=script.processing_status,
        pages=[ScriptPageResponse.model_validate(p) for p in script.pages],
        evaluations=eval_items
    )

def _build_eval_response(ev: Evaluation) -> EvaluationDetailResponse:
    sub = ev.submission
    q = sub.question
    script = sub.script

    ext_ans = next((ea for ea in script.extracted_answers if ea.question_id == q.id), None)
    rev = ev.latest_review

    crit_responses = []
    for ce in ev.criterion_evaluations:
        crit_responses.append({
            "id": ce.id,
            "criterion_id": ce.criterion_id,
            "criterion_name": ce.criterion.name if ce.criterion else "Criterion",
            "maximum_marks": ce.maximum_marks,
            "awarded_marks": ce.awarded_marks,
            "explanation": ce.explanation,
            "evidence": ce.evidence,
            "missing_concepts": ce.missing_concepts,
            "incorrect_concepts": ce.incorrect_concepts,
            "confidence": ce.confidence
        })

    rev_response = None
    if rev:
        rev_response = {
            "id": rev.id,
            "evaluation_id": rev.evaluation_id,
            "teacher_id": rev.teacher_id,
            "teacher_name": rev.teacher.full_name if rev.teacher else "Teacher",
            "original_ai_marks": rev.original_ai_marks,
            "final_marks": rev.final_marks,
            "override_reason": rev.override_reason,
            "teacher_comments": rev.teacher_comments,
            "status": rev.status,
            "reviewed_at": rev.reviewed_at
        }

    return EvaluationDetailResponse(
        id=ev.id,
        submission_id=ev.submission_id,
        question_id=q.id,
        question_number=q.question_number,
        question_text=q.text,
        max_marks=q.max_marks,
        student_roll_no=script.student_roll_no,
        student_name=script.student_name,
        student_answer=sub.student_answer,
        original_ocr_text=ext_ans.original_ocr_text if ext_ans else None,
        corrected_text=ext_ans.corrected_text if ext_ans else None,
        original_ai_marks=ev.original_ai_marks,
        maximum_marks=ev.maximum_marks,
        effective_marks=ev.effective_marks,
        ai_feedback=ev.ai_feedback,
        confidence=ev.confidence,
        requires_human_review=ev.requires_human_review,
        review_reason=ev.review_reason,
        provider=ev.provider,
        status=ev.status,
        evaluated_at=ev.evaluated_at,
        execution_time_ms=ev.execution_time_ms,
        criteria_evaluations=crit_responses,
        latest_review=rev_response
    )
