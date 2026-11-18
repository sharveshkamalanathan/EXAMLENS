import io
import csv
import statistics
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.exam import Exam
from app.models.script import AnswerScript, Submission
from app.models.question import Question
from app.models.evaluation import Evaluation, CriterionEvaluation
from app.schemas.analytics import (
    ExamAnalyticsResponse,
    ScoreDistributionBucket,
    QuestionPerformance,
    TopicPerformance,
    StudentAnalyticsResponse,
    StudentExamResultResponse
)

def compute_exam_analytics(db: Session, exam_id: str) -> ExamAnalyticsResponse:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError("Exam not found")

    scripts = db.query(AnswerScript).filter(AnswerScript.exam_id == exam_id).all()
    total_students = len(scripts)
    
    # Filter scripts that have evaluations
    evaluated_scripts = [s for s in scripts if s.total_score is not None]
    evaluated_count = len(evaluated_scripts)
    approved_count = len([s for s in evaluated_scripts if s.is_approved])

    scores = [s.total_score for s in evaluated_scripts]
    max_marks = exam.total_marks or 50.0
    pass_marks = exam.passing_marks or (max_marks * 0.4)

    if scores:
        avg_score = round(statistics.mean(scores), 2)
        highest = round(max(scores), 2)
        lowest = round(min(scores), 2)
        median = round(statistics.median(scores), 2)
        passed_count = len([s for s in scores if s >= pass_marks])
        pass_pct = round((passed_count / len(scores)) * 100, 1)
    else:
        avg_score = 0.0
        highest = 0.0
        lowest = 0.0
        median = 0.0
        pass_pct = 0.0

    # Score distribution histogram (5 buckets: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
    buckets = [
        {"range_label": "0 - 20%", "count": 0},
        {"range_label": "21 - 40%", "count": 0},
        {"range_label": "41 - 60%", "count": 0},
        {"range_label": "61 - 80%", "count": 0},
        {"range_label": "81 - 100%", "count": 0},
    ]

    for score in scores:
        pct = (score / max_marks) * 100 if max_marks > 0 else 0
        if pct <= 20:
            buckets[0]["count"] += 1
        elif pct <= 40:
            buckets[1]["count"] += 1
        elif pct <= 60:
            buckets[2]["count"] += 1
        elif pct <= 80:
            buckets[3]["count"] += 1
        else:
            buckets[4]["count"] += 1

    distribution = [ScoreDistributionBucket(**b) for b in buckets]

    # Question performance
    q_performance_list: List[QuestionPerformance] = []
    top_missed_concepts_all: List[str] = []
    topic_scores: Dict[str, List[float]] = {}

    for q in exam.questions:
        q_scores = []
        q_missed = []
        
        # Submissions for this question
        subs = db.query(Submission).filter(Submission.question_id == q.id).all()
        for sub in subs:
            if sub.evaluations:
                latest_eval = sub.evaluations[-1]
                q_scores.append(latest_eval.effective_marks)
                for ce in latest_eval.criterion_evaluations:
                    q_missed.extend(ce.missing_concepts)

        q_avg = statistics.mean(q_scores) if q_scores else 0.0
        q_avg_pct = round((q_avg / q.max_marks) * 100, 1) if q.max_marks > 0 else 0.0

        # Tally missed concepts
        from collections import Counter
        missed_counts = Counter(q_missed).most_common(3)
        top_missed = [item[0] for item in missed_counts]
        top_missed_concepts_all.extend(top_missed)

        q_performance_list.append(QuestionPerformance(
            question_id=q.id,
            question_number=q.question_number,
            topic=q.topic or "General",
            max_marks=q.max_marks,
            average_marks=round(q_avg, 2),
            average_percentage=q_avg_pct,
            difficulty=q.difficulty,
            most_missed_concepts=top_missed
        ))

        # Topic aggregation
        topic = q.topic or "General"
        if topic not in topic_scores:
            topic_scores[topic] = []
        if q_scores:
            topic_scores[topic].append(q_avg_pct)

    topic_performance_list = [
        TopicPerformance(
            topic=t,
            average_percentage=round(statistics.mean(pcts), 1) if pcts else 0.0,
            question_count=len(pcts)
        )
        for t, pcts in topic_scores.items()
    ]

    return ExamAnalyticsResponse(
        exam_id=exam.id,
        exam_title=exam.title,
        total_students=total_students,
        evaluated_students=evaluated_count,
        approved_students=approved_count,
        average_score=avg_score,
        highest_score=highest,
        lowest_score=lowest,
        median_score=median,
        pass_percentage=pass_pct,
        score_distribution=distribution,
        question_performance=q_performance_list,
        topic_performance=topic_performance_list,
        top_missed_concepts=list(dict.fromkeys(top_missed_concepts_all))[:6],
        is_published=exam.is_published
    )

def generate_exam_results_csv(db: Session, exam_id: str) -> str:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError("Exam not found")

    scripts = db.query(AnswerScript).filter(AnswerScript.exam_id == exam_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    q_headers = [f"{q.question_number} (/{q.max_marks})" for q in exam.questions]
    writer.writerow(["Roll No", "Student Name", *q_headers, "Total Marks", "Max Marks", "Percentage", "Status"])

    for s in scripts:
        row = [s.student_roll_no, s.student_name or "N/A"]
        # Question scores
        for q in exam.questions:
            sub = db.query(Submission).filter(
                Submission.answer_script_id == s.id,
                Submission.question_id == q.id
            ).first()
            if sub and sub.evaluations:
                row.append(str(sub.evaluations[-1].effective_marks))
            else:
                row.append("-")

        tot = s.total_score if s.total_score is not None else 0.0
        pct = round((tot / exam.total_marks) * 100, 1) if exam.total_marks > 0 else 0
        status_str = "Passed" if tot >= (exam.passing_marks or 0) else "Failed"
        row.extend([str(tot), str(exam.total_marks), f"{pct}%", status_str])
        writer.writerow(row)

    return output.getvalue()
