import os
import sys
import json
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question, RubricCriterion
from app.models.script import AnswerScript, ScriptPage, OCRResult, ExtractedAnswer, Submission
from app.models.evaluation import Evaluation, CriterionEvaluation, TeacherReview

def create_backup():
    db = SessionLocal()
    try:
        u = db.query(User).filter_by(email='sharveshofficalmicro@gmail.com').first()
        if not u:
            print("Error: Target user 'sharveshofficalmicro@gmail.com' not found.")
            return False

        backup_dir = os.path.join(BASE_DIR, 'backups')
        storage_dest_dir = os.path.join(backup_dir, 'storage_cia_assets')
        os.makedirs(backup_dir, exist_ok=True)
        os.makedirs(storage_dest_dir, exist_ok=True)

        # 1. Full SQLite physical database snapshot
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        db_source = os.path.join(BASE_DIR, 'backend', 'examlens.db')
        db_snapshot = os.path.join(backup_dir, f'examlens_database_snapshot_{timestamp_str}.db')
        shutil.copy2(db_source, db_snapshot)
        print(f"[OK] Database Snapshot: {db_snapshot}")

        # 2. Comprehensive JSON Export for CIA 1 and CIA 2
        backup_data = {
            'exported_at': datetime.now().isoformat(),
            'account': {
                'id': u.id,
                'full_name': u.full_name,
                'email': u.email,
                'institution': u.institution,
                'department': u.department,
                'role': u.role,
                'created_at': u.created_at.isoformat() if u.created_at else None
            },
            'exams': []
        }

        exams = db.query(Exam).filter_by(teacher_id=u.id).all()
        copied_files = 0

        for e in exams:
            e_dict = {
                'id': e.id,
                'title': e.title,
                'subject': e.subject,
                'department': e.department,
                'class_name': e.class_name,
                'section': e.section,
                'academic_year': e.academic_year,
                'exam_type': e.exam_type,
                'total_marks': e.total_marks,
                'passing_marks': e.passing_marks,
                'status': e.status,
                'is_published': e.is_published,
                'created_at': e.created_at.isoformat() if e.created_at else None,
                'questions': [],
                'scripts': []
            }

            # Questions & Rubrics
            questions = db.query(Question).filter_by(exam_id=e.id).order_by(Question.display_order).all()
            for q in questions:
                q_dict = {
                    'id': q.id,
                    'question_number': q.question_number,
                    'text': q.text,
                    'question_type': q.question_type,
                    'max_marks': q.max_marks,
                    'topic': q.topic,
                    'difficulty': q.difficulty,
                    'reference_answer': q.reference_answer,
                    'important_concepts_json': q.important_concepts_json,
                    'display_order': q.display_order,
                    'rubrics': []
                }
                for r in q.rubric_criteria:
                    q_dict['rubrics'].append({
                        'id': r.id,
                        'name': r.name,
                        'description': r.description,
                        'max_marks': r.max_marks,
                        'scoring_instructions': r.scoring_instructions,
                        'display_order': r.display_order
                    })
                e_dict['questions'].append(q_dict)

            # Scripts, Pages, OCR, Submissions, Evaluations
            scripts = db.query(AnswerScript).filter_by(exam_id=e.id).all()
            for s in scripts:
                s_dict = {
                    'id': s.id,
                    'student_name': s.student_name,
                    'student_roll_no': s.student_roll_no,
                    'original_file_name': s.original_file_name,
                    'stored_file_path': s.stored_file_path,
                    'file_type': s.file_type,
                    'page_count': s.page_count,
                    'upload_status': s.upload_status,
                    'processing_status': s.processing_status,
                    'total_score': s.total_score,
                    'is_approved': s.is_approved,
                    'uploaded_at': s.uploaded_at.isoformat() if s.uploaded_at else None,
                    'pages': [],
                    'submissions': []
                }

                # Copy upload file
                rel_upload = s.stored_file_path.replace('/storage/', '').lstrip('/')
                upload_disk_path = os.path.join(BASE_DIR, 'storage', rel_upload.replace('/', os.sep))
                if os.path.exists(upload_disk_path):
                    dest = os.path.join(storage_dest_dir, rel_upload.replace('/', os.sep))
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    shutil.copy2(upload_disk_path, dest)
                    copied_files += 1

                for p in s.pages:
                    p_dict = {
                        'id': p.id,
                        'page_number': p.page_number,
                        'original_image_path': p.original_image_path,
                        'processed_image_path': p.processed_image_path,
                        'preprocessing_status': p.preprocessing_status,
                        'ocr_results': []
                    }

                    # Copy page images
                    for p_img in [p.original_image_path, p.processed_image_path]:
                        if p_img:
                            rel_p = p_img.replace('/storage/', '').lstrip('/')
                            p_disk = os.path.join(BASE_DIR, 'storage', rel_p.replace('/', os.sep))
                            if os.path.exists(p_disk):
                                dest_p = os.path.join(storage_dest_dir, rel_p.replace('/', os.sep))
                                os.makedirs(os.path.dirname(dest_p), exist_ok=True)
                                shutil.copy2(p_disk, dest_p)
                                copied_files += 1

                    for o in p.ocr_results:
                        p_dict['ocr_results'].append({
                            'id': o.id,
                            'provider': o.provider,
                            'extracted_text': o.extracted_text,
                            'confidence': o.confidence,
                            'structured_output_json': o.structured_output_json
                        })
                    s_dict['pages'].append(p_dict)

                # Submissions & Evaluations
                for sub in s.submissions:
                    sub_dict = {
                        'id': sub.id,
                        'question_id': sub.question_id,
                        'student_answer': sub.student_answer,
                        'verification_status': sub.verification_status,
                        'evaluations': []
                    }
                    for ev in sub.evaluations:
                        ev_dict = {
                            'id': ev.id,
                            'original_ai_marks': ev.original_ai_marks,
                            'maximum_marks': ev.maximum_marks,
                            'ai_feedback': ev.ai_feedback,
                            'confidence': ev.confidence,
                            'status': ev.status,
                            'criterion_evaluations': []
                        }
                        for ce in ev.criterion_evaluations:
                            ev_dict['criterion_evaluations'].append({
                                'id': ce.id,
                                'criterion_id': ce.criterion_id,
                                'maximum_marks': ce.maximum_marks,
                                'awarded_marks': ce.awarded_marks,
                                'explanation': ce.explanation,
                                'evidence': ce.evidence
                            })
                        sub_dict['evaluations'].append(ev_dict)
                    s_dict['submissions'].append(sub_dict)

                e_dict['scripts'].append(s_dict)

            backup_data['exams'].append(e_dict)

        json_file_path = os.path.join(backup_dir, 'cia_exams_account_backup.json')
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2)

        print(f"[OK] JSON Backup saved: {json_file_path}")
        print(f"[OK] Total Exams Exported: {len(backup_data['exams'])}")
        print(f"[OK] Total Storage Assets Preserved: {copied_files} files")
        return True
    finally:
        db.close()

if __name__ == '__main__':
    create_backup()
