import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_teacher
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question, RubricCriterion
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    RubricCriterionCreate,
    RubricCriterionResponse
)

router = APIRouter(tags=["Questions & Rubrics"])

@router.get("/exams/{exam_id}/questions", response_model=List[QuestionResponse])
def get_exam_questions(
    exam_id: str,
    db: Session = Depends(get_db)
):
    questions = db.query(Question).filter(Question.exam_id == exam_id).order_by(Question.display_order).all()
    return questions

@router.post("/exams/{exam_id}/questions", response_model=QuestionResponse)
def create_question(
    exam_id: str,
    q_in: QuestionCreate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == current_teacher.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or unauthorized")

    # Validate that rubric criteria sum equals question maximum marks (if criteria provided)
    if q_in.rubric_criteria:
        rubric_sum = sum(c.max_marks for c in q_in.rubric_criteria)
        if abs(rubric_sum - q_in.max_marks) > 0.05:
            raise HTTPException(
                status_code=400,
                detail=f"The sum of rubric criteria marks ({rubric_sum}) must equal the question maximum marks ({q_in.max_marks})."
            )

    question = Question(
        exam_id=exam_id,
        parent_question_id=q_in.parent_question_id,
        question_number=q_in.question_number,
        text=q_in.text,
        question_type=q_in.question_type,
        max_marks=q_in.max_marks,
        topic=q_in.topic,
        difficulty=q_in.difficulty,
        reference_answer=q_in.reference_answer,
        important_concepts_json=json.dumps(q_in.important_concepts),
        alternative_explanations_json=json.dumps(q_in.alternative_explanations),
        optional_keywords_json=json.dumps(q_in.optional_keywords),
        display_order=q_in.display_order
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Add criteria
    for crit_in in q_in.rubric_criteria:
        crit = RubricCriterion(
            question_id=question.id,
            name=crit_in.name,
            description=crit_in.description,
            expected_concepts_json=json.dumps(crit_in.expected_concepts),
            max_marks=crit_in.max_marks,
            scoring_instructions=crit_in.scoring_instructions,
            display_order=crit_in.display_order
        )
        db.add(crit)

    db.commit()
    db.refresh(question)
    return question

@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: str,
    q_in: QuestionUpdate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if question.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if q_in.question_number is not None: question.question_number = q_in.question_number
    if q_in.text is not None: question.text = q_in.text
    if q_in.question_type is not None: question.question_type = q_in.question_type
    if q_in.max_marks is not None: question.max_marks = q_in.max_marks
    if q_in.topic is not None: question.topic = q_in.topic
    if q_in.difficulty is not None: question.difficulty = q_in.difficulty
    if q_in.reference_answer is not None: question.reference_answer = q_in.reference_answer
    if q_in.important_concepts is not None: question.important_concepts_json = json.dumps(q_in.important_concepts)
    if q_in.alternative_explanations is not None: question.alternative_explanations_json = json.dumps(q_in.alternative_explanations)
    if q_in.optional_keywords is not None: question.optional_keywords_json = json.dumps(q_in.optional_keywords)
    if q_in.display_order is not None: question.display_order = q_in.display_order

    db.commit()
    db.refresh(question)
    return question

@router.delete("/questions/{question_id}")
def delete_question(
    question_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}

@router.post("/questions/{question_id}/rubric", response_model=RubricCriterionResponse)
def add_rubric_criterion(
    question_id: str,
    crit_in: RubricCriterionCreate,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    crit = RubricCriterion(
        question_id=question_id,
        name=crit_in.name,
        description=crit_in.description,
        expected_concepts_json=json.dumps(crit_in.expected_concepts),
        max_marks=crit_in.max_marks,
        scoring_instructions=crit_in.scoring_instructions,
        display_order=crit_in.display_order
    )
    db.add(crit)
    db.commit()
    db.refresh(crit)
    return crit

@router.delete("/rubrics/{criterion_id}")
def delete_rubric_criterion(
    criterion_id: str,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    crit = db.query(RubricCriterion).filter(RubricCriterion.id == criterion_id).first()
    if not crit:
        raise HTTPException(status_code=404, detail="Criterion not found")
    if crit.question.exam.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(crit)
    db.commit()
    return {"message": "Criterion deleted successfully"}
