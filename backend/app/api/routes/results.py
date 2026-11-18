from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_user, get_current_student, get_current_teacher
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.script import AnswerScript, Submission
from app.schemas.analytics import StudentExamResultResponse

router = APIRouter(tags=["Results & Student Portal"])

@router.get("/student/results", response_model=List[StudentExamResultResponse])
def get_student_results(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Find all scripts for this student belonging to published exams
    scripts = db.query(AnswerScript).join(Exam).filter(
        AnswerScript.student_id == current_student.id,
        Exam.is_published == True
    ).order_by(Exam.exam_date.desc()).all()

    results = []
    for s in scripts:
        res = _build_student_exam_result(s, db)
        results.append(res)
    return results

@router.get("/student/results/{exam_id}", response_model=StudentExamResultResponse)
def get_student_exam_result_detail(
    exam_id: str,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam or not exam.is_published:
        raise HTTPException(
            status_code=403,
            detail="Exam results have not been published yet or exam does not exist."
        )

    script = db.query(AnswerScript).filter(
        AnswerScript.exam_id == exam_id,
        AnswerScript.student_id == current_student.id
    ).first()

    if not script:
        raise HTTPException(
            status_code=404,
            detail="No evaluated answer script found for your account in this exam."
        )

    return _build_student_exam_result(script, db)

def _build_student_exam_result(script: AnswerScript, db: Session) -> StudentExamResultResponse:
    exam = script.exam
    all_scripts = db.query(AnswerScript).filter(AnswerScript.exam_id == exam.id).all()
    all_scores = [s.total_score for s in all_scripts if s.total_score is not None]
    all_scores.sort(reverse=True)
    
    score = script.total_score if script.total_score is not None else 0.0
    rank = (all_scores.index(score) + 1) if score in all_scores else None

    # Question results breakdown
    q_results = []
    strengths_acc = []
    weaknesses_acc = []
    recommended_topics = []

    for q in exam.questions:
        sub = db.query(Submission).filter(
            Submission.answer_script_id == script.id,
            Submission.question_id == q.id
        ).first()

        awarded_m = 0.0
        ai_fb = ""
        teacher_comm = ""
        missing_c = []

        if sub and sub.evaluations:
            ev = sub.evaluations[-1]
            awarded_m = ev.effective_marks
            ai_fb = ev.ai_feedback or ""
            
            if ev.latest_review and ev.latest_review.teacher_comments:
                teacher_comm = ev.latest_review.teacher_comments

            for ce in ev.criterion_evaluations:
                missing_c.extend(ce.missing_concepts)

            # Accumulate educational insights
            ratio = awarded_m / q.max_marks if q.max_marks > 0 else 0
            if ratio >= 0.8:
                strengths_acc.append(f"Strong performance in {q.topic} ({q.question_number})")
            elif ratio < 0.6:
                weaknesses_acc.append(f"Conceptual gaps in {q.topic} ({q.question_number})")
                recommended_topics.append(q.topic)

        q_results.append({
            "question_id": q.id,
            "question_number": q.question_number,
            "question_text": q.text,
            "max_marks": q.max_marks,
            "topic": q.topic,
            "awarded_marks": awarded_m,
            "ai_feedback": ai_fb,
            "teacher_comment": teacher_comm,
            "missing_concepts": missing_c,
            "student_answer_snippet": sub.student_answer[:200] + "..." if (sub and len(sub.student_answer) > 200) else (sub.student_answer if sub else "No answer recorded")
        })

    tot_marks = exam.total_marks or 50.0
    pct = round((score / tot_marks) * 100, 1) if tot_marks > 0 else 0.0
    pass_marks = exam.passing_marks or (tot_marks * 0.4)

    return StudentExamResultResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        subject=exam.subject,
        exam_date=exam.exam_date,
        total_marks=tot_marks,
        student_score=score,
        percentage=pct,
        passed=(score >= pass_marks),
        rank=rank,
        total_students=len(all_scripts),
        published_at=exam.published_at,
        question_results=q_results,
        teacher_overall_comment="Great effort overall. Pay close attention to the highlighted feedback for upcoming exams.",
        strengths=list(dict.fromkeys(strengths_acc))[:4],
        weaknesses=list(dict.fromkeys(weaknesses_acc))[:4],
        recommended_topics=list(dict.fromkeys(recommended_topics))[:3]
    )
