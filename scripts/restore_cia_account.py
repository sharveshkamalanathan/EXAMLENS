import os
import sys
import json
import shutil
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))

from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.exam import Exam
from app.models.question import Question, RubricCriterion
from app.models.script import AnswerScript, ScriptPage, OCRResult, Submission
from app.models.evaluation import Evaluation, CriterionEvaluation
from app.core.security import get_password_hash

def restore_backup():
    json_path = os.path.join(BASE_DIR, 'backups', 'cia_exams_account_backup.json')
    assets_dir = os.path.join(BASE_DIR, 'backups', 'storage_cia_assets')

    if not os.path.exists(json_path):
        print(f"Backup file not found at: {json_path}")
        return False

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        acc = data['account']
        user = db.query(User).filter_by(email=acc['email']).first()
        if not user:
            user = User(
                id=acc['id'],
                full_name=acc['full_name'],
                email=acc['email'],
                hashed_password=get_password_hash('94865'),
                role=acc['role'] or UserRole.TEACHER,
                institution=acc['institution'] or 'SKCET',
                department=acc['department']
            )
            db.add(user)
            db.commit()
            print(f"[OK] Restored Account: {user.email}")
        else:
            print(f"[INFO] Account already exists: {user.email}")

        # Restore physical assets
        if os.path.exists(assets_dir):
            storage_dir = os.path.join(BASE_DIR, 'storage')
            for root, dirs, files in os.walk(assets_dir):
                for file in files:
                    src_file = os.path.join(root, file)
                    rel_path = os.path.relpath(src_file, assets_dir)
                    dest_file = os.path.join(storage_dir, rel_path)
                    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
                    if not os.path.exists(dest_file):
                        shutil.copy2(src_file, dest_file)

        # Restore Exams
        for e_data in data['exams']:
            exam = db.query(Exam).filter_by(id=e_data['id']).first()
            if not exam:
                exam = Exam(
                    id=e_data['id'],
                    teacher_id=user.id,
                    title=e_data['title'],
                    subject=e_data['subject'],
                    department=e_data.get('department'),
                    class_name=e_data.get('class_name'),
                    section=e_data.get('section'),
                    academic_year=e_data.get('academic_year'),
                    exam_type=e_data.get('exam_type'),
                    total_marks=e_data['total_marks'],
                    passing_marks=e_data.get('passing_marks', 20.0),
                    status=e_data['status'],
                    is_published=e_data.get('is_published', False)
                )
                db.add(exam)
                db.commit()
                print(f"[OK] Restored Exam: {exam.title}")

            # Restore Questions
            for q_data in e_data['questions']:
                q = db.query(Question).filter_by(id=q_data['id']).first()
                if not q:
                    q = Question(
                        id=q_data['id'],
                        exam_id=exam.id,
                        question_number=q_data['question_number'],
                        text=q_data['text'],
                        question_type=q_data['question_type'],
                        max_marks=q_data['max_marks'],
                        topic=q_data.get('topic'),
                        difficulty=q_data.get('difficulty', 'medium'),
                        reference_answer=q_data['reference_answer'],
                        important_concepts_json=q_data.get('important_concepts_json', '[]'),
                        display_order=q_data.get('display_order', 1)
                    )
                    db.add(q)
                    db.commit()

                # Rubrics
                for r_data in q_data['rubrics']:
                    r = db.query(RubricCriterion).filter_by(id=r_data['id']).first()
                    if not r:
                        r = RubricCriterion(
                            id=r_data['id'],
                            question_id=q.id,
                            name=r_data['name'],
                            description=r_data.get('description'),
                            max_marks=r_data['max_marks'],
                            scoring_instructions=r_data.get('scoring_instructions'),
                            display_order=r_data.get('display_order', 1)
                        )
                        db.add(r)
                        db.commit()

        print("[OK] Restore completed successfully!")
        return True
    finally:
        db.close()

if __name__ == '__main__':
    restore_backup()
