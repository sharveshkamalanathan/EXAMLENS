import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.evaluation import Evaluation, TeacherReview
from app.models.script import AnswerScript, Submission
from app.models.audit import AuditLog
from app.schemas.evaluation import TeacherReviewCreate

def record_teacher_override(
    db: Session,
    evaluation_id: str,
    teacher_id: str,
    review_data: TeacherReviewCreate
) -> TeacherReview:
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise ValueError("Evaluation not found")

    # Capture previous state
    previous_review = evaluation.latest_review
    previous_marks = previous_review.final_marks if previous_review else evaluation.original_ai_marks

    # Create new review record without altering original_ai_marks
    review = TeacherReview(
        evaluation_id=evaluation.id,
        teacher_id=teacher_id,
        original_ai_marks=evaluation.original_ai_marks,
        final_marks=review_data.final_marks,
        override_reason=review_data.override_reason,
        teacher_comments=review_data.teacher_comments,
        status=review_data.status,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(review)

    # Update evaluation status
    evaluation.status = "needs_review" if review_data.status == "rejected" else "completed"
    evaluation.requires_human_review = False

    # Recalculate script total score
    submission = evaluation.submission
    if submission:
        script = submission.script
        if script:
            # Sum up effective scores for all submissions of this script
            total = 0.0
            all_approved = True
            for sub in script.submissions:
                if sub.evaluations:
                    latest_eval = sub.evaluations[-1]
                    total += latest_eval.effective_marks
                else:
                    all_approved = False
            
            script.total_score = round(total, 2)
            script.is_approved = all_approved
            if all_approved and script.processing_status != "published":
                script.processing_status = "teacher_approved"

    # Log to audit trail
    audit = AuditLog(
        user_id=teacher_id,
        entity_type="evaluation",
        entity_id=evaluation.id,
        action="score_override" if review_data.final_marks != evaluation.original_ai_marks else "score_approved",
        previous_data_json=json.dumps({"marks": previous_marks, "ai_marks": evaluation.original_ai_marks}),
        new_data_json=json.dumps({
            "final_marks": review_data.final_marks,
            "reason": review_data.override_reason,
            "status": review_data.status
        })
    )
    db.add(audit)
    db.commit()
    db.refresh(review)
    return review
