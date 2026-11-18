import subprocess
import time
import requests
import sys
import os

print("=== STARTING EXAMLENS COMPLETE LIFECYCLE VERIFICATION ===", flush=True)

# Start uvicorn server in background
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=r"C:\Users\sharv\.gemini\antigravity\scratch\ExamLens\backend"
)

BASE_URL = "http://127.0.0.1:8000"

try:
    time.sleep(3)
    
    # 1. System Status Check
    print("\n--- 1. SYSTEM STATUS & CONFIGURATION ---", flush=True)
    res_sys = requests.get(f"{BASE_URL}/api/system/status", timeout=5)
    assert res_sys.status_code == 200, f"System status failed: {res_sys.status_code}"
    status_data = res_sys.json()
    print(f"App: {status_data['app_name']} - '{status_data['tagline']}'")
    print(f"Demo Mode: {status_data['demo_mode']}")
    print(f"OCR Provider: {status_data['ocr']['active_provider']} ({status_data['ocr']['status_label']})")
    print(f"AI Provider: {status_data['ai']['active_provider']} ({status_data['ai']['status_label']})")

    # 2. Teacher Authentication
    print("\n--- 2. TEACHER AUTHENTICATION ---", flush=True)
    res_t_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teacher@examlens.edu",
        "password": "examlens123"
    }, timeout=5)
    assert res_t_login.status_code == 200, f"Teacher login failed: {res_t_login.text}"
    teacher_token = res_t_login.json()["access_token"]
    teacher_user = res_t_login.json()["user"]
    print(f"Logged in as Teacher: {teacher_user['full_name']} ({teacher_user['role']})")
    t_headers = {"Authorization": f"Bearer {teacher_token}"}

    # 3. Exam & Question Rubrics Verification
    print("\n--- 3. EXAMS & RUBRIC VERIFICATION ---", flush=True)
    res_exams = requests.get(f"{BASE_URL}/api/exams", headers=t_headers, timeout=5)
    assert res_exams.status_code == 200
    exams = res_exams.json()
    print(f"Total exams configured: {len(exams)}")
    assert len(exams) >= 1, "Expected at least 1 exam in database"
    
    # Find the exam with seeded scripts (Operating Systems)
    primary_exam = next((e for e in exams if "Operating" in e["title"]), exams[0])
    exam_id = primary_exam["id"]
    print(f"Selected Exam: {primary_exam['title']} (Subject: {primary_exam['subject']}, Total Marks: {primary_exam['total_marks']})")

    res_questions = requests.get(f"{BASE_URL}/api/exams/{exam_id}/questions", headers=t_headers, timeout=5)
    assert res_questions.status_code == 200
    questions = res_questions.json()
    print(f"Questions configured: {len(questions)}")
    for q in questions:
        print(f"  Q{q['question_number']}: '{q['text'][:50]}...' ({q['max_marks']} marks, {len(q['rubric_criteria'])} criteria)")

    # 4. Answer Scripts & Handwriting OCR Verification
    print("\n--- 4. ANSWER SCRIPTS & OCR DATA ---", flush=True)
    res_scripts = requests.get(f"{BASE_URL}/api/exams/{exam_id}/scripts", headers=t_headers, timeout=5)
    assert res_scripts.status_code == 200
    scripts = res_scripts.json()
    print(f"Uploaded physical answer scripts: {len(scripts)}")
    assert len(scripts) >= 1, "Expected at least 1 script in database"

    first_script = scripts[0]
    script_id = first_script["id"]
    print(f"Sample Script: Student {first_script['student_roll_no']} ({first_script.get('student_name', 'Student')})")
    print(f"Status: {first_script['processing_status']}, Pages: {first_script['page_count']}")

    # Page-level OCR
    res_ocr = requests.get(f"{BASE_URL}/api/scripts/{script_id}/ocr", headers=t_headers, timeout=5)
    assert res_ocr.status_code == 200
    page_ocr_results = res_ocr.json()
    print(f"Page OCR Results Count: {len(page_ocr_results)}")
    if page_ocr_results:
        print(f"  Page 1 OCR Provider: {page_ocr_results[0].get('provider')}, Confidence: {page_ocr_results[0].get('confidence')}")

    # Script detail with segmented answers
    res_script_detail = requests.get(f"{BASE_URL}/api/scripts/{script_id}", headers=t_headers, timeout=5)
    assert res_script_detail.status_code == 200
    script_detail = res_script_detail.json()
    ocr_answers = script_detail.get("extracted_answers", [])
    print(f"OCR Segmented Question Answers: {len(ocr_answers)}")
    for ans in ocr_answers:
        snippet = ans['original_ocr_text'][:40].replace('\n', ' ')
        print(f"  Q{ans.get('question_number', '?')}: '{snippet}...' (Conf: {ans.get('segmentation_confidence', 'N/A')})")

    # 5. Teacher Manual OCR Correction
    print("\n--- 5. TEACHER OCR TEXT VERIFICATION & CORRECTION ---", flush=True)
    if ocr_answers:
        test_ans = ocr_answers[0]
        ans_id = test_ans["id"]
        corrected_text = test_ans["original_ocr_text"] + " [Teacher Verified Spelling]"
        res_update = requests.put(
            f"{BASE_URL}/api/answers/{ans_id}",
            headers=t_headers,
            json={"corrected_text": corrected_text, "verification_status": "verified"},
            timeout=5
        )
        assert res_update.status_code == 200
        print(f"Teacher successfully verified OCR text for Q{test_ans.get('question_number', '1')}")

    # 6. AI Evaluation Verification
    print("\n--- 6. AI SEMANTIC EVALUATION ENGINE ---", flush=True)
    res_eval = requests.get(f"{BASE_URL}/api/scripts/{script_id}/evaluation", headers=t_headers, timeout=5)
    assert res_eval.status_code == 200
    eval_summary = res_eval.json()
    print(f"Evaluations retrieved for script {script_id}:")
    print(f"  Total Score: {eval_summary['total_score']} / {eval_summary['max_total_marks']} ({eval_summary['percentage']}%)")
    print(f"  Approved by Faculty: {eval_summary['is_approved']}")

    assert len(eval_summary["evaluations"]) > 0, "Expected evaluation details"
    first_eval = eval_summary["evaluations"][0]
    print(f"  Sample Q{first_eval['question_number']} AI Awarded Marks: {first_eval['original_ai_marks']} / {first_eval['maximum_marks']}")
    print(f"  AI Feedback: '{first_eval.get('ai_feedback', '')[:80]}...'")
    print(f"  Criteria Breakdown: {len(first_eval['criteria_evaluations'])} items evaluated")

    # 7. Teacher Override & Final Authority
    print("\n--- 7. TEACHER MARK OVERRIDE & AUDIT LOG ---", flush=True)
    eval_id = first_eval["id"]
    new_override_marks = min(first_eval["maximum_marks"], first_eval["original_ai_marks"] + 1.0)
    res_override = requests.post(
        f"{BASE_URL}/api/evaluations/{eval_id}/override",
        headers=t_headers,
        json={
            "final_marks": new_override_marks,
            "override_reason": "Teacher gave additional credit for diagrammatic clarity and intuitive explanation.",
            "teacher_comments": "Well-structured response, clear conceptual linkage."
        },
        timeout=5
    )
    assert res_override.status_code == 200, f"Override failed: {res_override.text}"
    override_result = res_override.json()
    print(f"Mark overridden: Original AI Marks = {override_result['original_ai_marks']}, Final Teacher Marks = {override_result['final_marks']}")
    assert override_result["original_ai_marks"] == first_eval["original_ai_marks"], "Original AI marks must be strictly preserved!"
    assert override_result["final_marks"] == new_override_marks, "Final marks must reflect teacher decision!"

    # Verify audit log trail
    res_audit = requests.get(f"{BASE_URL}/api/evaluations/{eval_id}/audit", headers=t_headers, timeout=5)
    assert res_audit.status_code == 200
    audit_trail = res_audit.json()
    print(f"Audit log entries recorded for evaluation: {len(audit_trail)}")
    assert len(audit_trail) >= 1, "Audit trail entry must be recorded when teacher overrides marks"

    # 8. Teacher Script Approval
    print("\n--- 8. SCRIPT APPROVAL ---", flush=True)
    res_approve = requests.post(f"{BASE_URL}/api/scripts/{script_id}/approve-all", headers=t_headers, timeout=5)
    assert res_approve.status_code == 200
    print(f"Entire script {script_id} approved by teacher: {res_approve.json().get('status')}")

    # 9. Results Publishing & Student Access Control
    print("\n--- 9. RESULT PUBLICATION & STUDENT PORTAL GATING ---", flush=True)
    # Publish exam results
    res_publish = requests.post(f"{BASE_URL}/api/exams/{exam_id}/publish", headers=t_headers, timeout=5)
    assert res_publish.status_code == 200
    print(f"Exam '{primary_exam['title']}' officially published: {res_publish.json().get('is_published')}")

    # Log in as student
    res_s_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "stu101@examlens.edu",
        "password": "examlens123"
    }, timeout=5)
    assert res_s_login.status_code == 200, f"Student login failed: {res_s_login.text}"
    student_token = res_s_login.json()["access_token"]
    student_user = res_s_login.json()["user"]
    print(f"Logged in as Student: {student_user['full_name']} (Roll: {student_user.get('roll_number')})")
    s_headers = {"Authorization": f"Bearer {student_token}"}

    # Fetch student published results
    res_s_results = requests.get(f"{BASE_URL}/api/student/results", headers=s_headers, timeout=5)
    assert res_s_results.status_code == 200
    s_results = res_s_results.json()
    print(f"Student published results visible: {len(s_results)}")
    assert len(s_results) >= 1, "Published exam result must be accessible to enrolled student"
    s_result = s_results[0]
    print(f"  Exam: {s_result['exam_title']} - Score: {s_result['student_score']}/{s_result['total_marks']} ({s_result['percentage']}%)")
    print(f"  Rank: #{s_result.get('rank')} of {s_result.get('total_students')}")
    print(f"  Strengths: {s_result.get('strengths', [])}")
    print(f"  Suggested Focus: {s_result.get('weaknesses', [])}")

    # Inspect student detail scorecard
    res_s_detail = requests.get(f"{BASE_URL}/api/student/results/{exam_id}", headers=s_headers, timeout=5)
    assert res_s_detail.status_code == 200
    s_detail = res_s_detail.json()
    print(f"Student question-by-question breakdown count: {len(s_detail['question_results'])}")

    # 10. Teacher Analytics & CSV Export
    print("\n--- 10. TEACHER ANALYTICS & CSV EXPORT ---", flush=True)
    res_analytics = requests.get(f"{BASE_URL}/api/analytics/exam/{exam_id}", headers=t_headers, timeout=5)
    assert res_analytics.status_code == 200
    analytics_data = res_analytics.json()
    print(f"Class Average: {analytics_data['average_score']} / {primary_exam['total_marks']}")
    print(f"Pass Percentage: {analytics_data['pass_percentage']}%")
    print(f"Score Distribution brackets: {len(analytics_data['score_distribution'])}")
    print(f"Top Conceptual Gaps Detected: {analytics_data.get('top_missed_concepts', [])}")

    res_csv = requests.get(f"{BASE_URL}/api/analytics/exam/{exam_id}/export-csv", headers=t_headers, timeout=5)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")
    csv_lines = res_csv.text.strip().split("\n")
    print(f"Exported CSV: {len(csv_lines)} rows (Header: '{csv_lines[0]}')")

    print("\n" + "="*60)
    print(">>> COMPLETE 19-STEP LIFECYCLE INTEGRATION TEST PASSED 100%! <<<")
    print("="*60 + "\n", flush=True)

finally:
    print("Stopping test server...", flush=True)
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except Exception:
        proc.kill()
    print("Test server stopped cleanly.")
