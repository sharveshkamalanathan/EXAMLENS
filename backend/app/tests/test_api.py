import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import Base, get_db
from app.services.seed_data import seed_database

# Test in-memory database with StaticPool so all connections share the same in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ExamLens"
    assert data["status"] == "healthy"

def test_teacher_registration_and_login(client):
    reg_payload = {
        "full_name": "Dr. Sarah Jenkins",
        "email": "sarah@nit.edu",
        "password": "Password123!",
        "role": "teacher",
        "institution": "NIT Calicut",
        "department": "Computer Science"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "sarah@nit.edu"

    login_resp = client.post("/api/auth/login", json={
        "email": "sarah@nit.edu",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["role"] == "teacher"

def test_exam_crud_and_rubric_validation(client):
    login_resp = client.post("/api/auth/login", json={"email": "sarah@nit.edu", "password": "Password123!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    exam_payload = {
        "title": "Computer Networks Quiz",
        "subject": "CS305: Computer Networks",
        "department": "CSE",
        "class_name": "B.Tech CS",
        "total_marks": 10.0,
        "passing_marks": 4.0,
        "instructions": "Answer all questions"
    }
    create_resp = client.post("/api/exams", json=exam_payload, headers=headers)
    assert create_resp.status_code == 200
    exam = create_resp.json()
    exam_id = exam["id"]
    assert exam["title"] == "Computer Networks Quiz"

    # Rubric validation test: criteria marks sum must match question max marks
    bad_q_payload = {
        "question_number": "Q1",
        "text": "Explain TCP 3-way handshake.",
        "max_marks": 5.0,
        "reference_answer": "SYN, SYN-ACK, ACK sequence.",
        "rubric_criteria": [
            {"name": "SYN packet", "max_marks": 2.0},
            {"name": "SYN-ACK packet", "max_marks": 1.0}
        ]
    }
    bad_q_resp = client.post(f"/api/exams/{exam_id}/questions", json=bad_q_payload, headers=headers)
    assert bad_q_resp.status_code == 400
    assert "sum of rubric criteria marks" in bad_q_resp.json()["detail"]

    # Valid question with matching rubric
    valid_q_payload = {
        "question_number": "Q1",
        "text": "Explain TCP 3-way handshake.",
        "max_marks": 5.0,
        "topic": "Transport Layer",
        "difficulty": "medium",
        "reference_answer": "SYN, SYN-ACK, ACK sequence establishing sequence numbers.",
        "important_concepts": ["SYN", "SYN-ACK", "ACK", "Sequence Numbers"],
        "rubric_criteria": [
            {"name": "SYN Stage", "max_marks": 2.0, "expected_concepts": ["SYN", "Client sequence number"]},
            {"name": "SYN-ACK Stage", "max_marks": 2.0, "expected_concepts": ["SYN-ACK", "Server sequence number"]},
            {"name": "ACK Final Stage", "max_marks": 1.0, "expected_concepts": ["ACK", "Connection established"]}
        ]
    }
    q_resp = client.post(f"/api/exams/{exam_id}/questions", json=valid_q_payload, headers=headers)
    assert q_resp.status_code == 200
    q_data = q_resp.json()
    assert len(q_data["rubric_criteria"]) == 3

def test_score_boundary_and_teacher_override_audit(client):
    login_resp = client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    exams_resp = client.get("/api/exams", headers=headers)
    assert exams_resp.status_code == 200
    exams = exams_resp.json()
    assert len(exams) >= 1
    # Select exam with seeded scripts (e.g. Operating Systems)
    exam_id = next((e["id"] for e in exams if "Operating Systems" in e["title"]), exams[0]["id"])

    scripts_resp = client.get(f"/api/exams/{exam_id}/scripts", headers=headers)
    assert scripts_resp.status_code == 200
    scripts = scripts_resp.json()
    assert len(scripts) >= 1
    script_id = scripts[0]["id"]

    eval_resp = client.get(f"/api/scripts/{script_id}/evaluation", headers=headers)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert len(eval_data["evaluations"]) >= 1

    first_eval = eval_data["evaluations"][0]
    eval_id = first_eval["id"]
    original_score = first_eval["original_ai_marks"]

    # Test score override
    override_payload = {
        "final_marks": min(first_eval["maximum_marks"], original_score + 0.5),
        "override_reason": "Teacher verified alternative accurate phrasing.",
        "teacher_comments": "Well-reasoned answer.",
        "status": "overridden"
    }
    override_resp = client.post(f"/api/evaluations/{eval_id}/override", json=override_payload, headers=headers)
    assert override_resp.status_code == 200
    ov_data = override_resp.json()
    assert ov_data["final_marks"] == override_payload["final_marks"]
    # Ensure original AI marks are preserved!
    assert ov_data["original_ai_marks"] == original_score

    # Check audit log
    audit_resp = client.get(f"/api/evaluations/{eval_id}/audit", headers=headers)
    assert audit_resp.status_code == 200
    audit_list = audit_resp.json()
    assert len(audit_list) >= 1

def test_student_results_gating(client):
    login_resp = client.post("/api/auth/login", json={"email": "stu101@examlens.edu", "password": "examlens123"})
    stu_token = login_resp.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    res_resp = client.get("/api/student/results", headers=stu_headers)
    assert res_resp.status_code == 200
    results = res_resp.json()
    assert len(results) >= 1
    assert results[0]["student_score"] > 0

def test_export_exam_csv(client):
    login_resp = client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    exams_resp = client.get("/api/exams", headers=headers)
    assert exams_resp.status_code == 200
    exams = exams_resp.json()
    exam_id = exams[0]["id"]

    # 1. Test CSV export with Bearer token in header
    csv_header_resp = client.get(f"/api/analytics/exam/{exam_id}/export-csv", headers=headers)
    assert csv_header_resp.status_code == 200
    assert "text/csv" in csv_header_resp.headers.get("content-type", "")
    assert "Roll No" in csv_header_resp.text

    # 2. Test CSV export with query parameter ?token=...
    csv_query_resp = client.get(f"/api/analytics/exam/{exam_id}/export-csv?token={token}")
    assert csv_query_resp.status_code == 200
    assert "text/csv" in csv_query_resp.headers.get("content-type", "")
    assert "Roll No" in csv_query_resp.text

def test_unified_question_segmentation_no_duplicates():
    from app.services.answer_segmentation import segment_text_by_questions
    from app.models.question import Question

    q1 = Question(id="q-1", exam_id="e-1", question_number="Q1", text="What is an Operating System? Explain its functions.", display_order=1)
    q2 = Question(id="q-2", exam_id="e-1", question_number="Q2", text="Explain the different types of Operating Systems.", display_order=2)
    questions = [q1, q2]

    # Student text where Q1 has internal numbered bullet points 1, 2, 3, 4, 5
    # Previously, each bullet point would mistakenly create duplicate / false question segments!
    handwritten_script_text = """
    Q1.
    An Operating System is system software that manages hardware.
    Major Functions:
    1. Process Management: Handles scheduling and resource allocation.
    2. Memory Management: Allocates RAM to running programs.
    3. File Management: Manages directory structures.
    4. Device Management: Controls I/O devices.
    5. Security Management: Protects against unauthorized access.

    Q2.
    Different types of Operating Systems include:
    1. Batch OS
    2. Time-Sharing OS
    3. Distributed OS
    """

    segments = segment_text_by_questions(handwritten_script_text, questions)
    # MUST have exactly 2 segments (one for Q1, one for Q2)
    assert len(segments) == 2, f"Expected exactly 2 segments, got {len(segments)}"
    assert segments[0]["question_id"] == "q-1"
    assert segments[1]["question_id"] == "q-2"

    # Verify that all 5 bullet points are preserved inside Q1's answer!
    assert "Memory Management" in segments[0]["text"]
    assert "File Management" in segments[0]["text"]
    assert "Security Management" in segments[0]["text"]

    # Verify that Q2 answer contains its bullet points
    assert "Batch OS" in segments[1]["text"]
    assert "Distributed OS" in segments[1]["text"]

def test_handwriting_enhancement():
    from app.services.ocr.handwriting_enhancer import clean_handwriting_text, normalize_question_marker

    raw_ocr = "L. DeSine Operating Systen and explain its najop Sunctions. It manages sostware and Siles Sron users."
    cleaned = clean_handwriting_text(raw_ocr)
    assert "Define" in cleaned
    assert "functions" in cleaned
    assert "software" in cleaned
    assert "files" in cleaned
    assert "from" in cleaned

    assert normalize_question_marker("QI") == "Q1"
    assert normalize_question_marker("QS") == "Q5"
    assert normalize_question_marker("Q. 2") == "Q2"

def test_skipped_question_detection_and_no_stealing():
    from app.services.answer_segmentation import segment_text_by_questions
    from app.models.question import Question

    q1 = Question(id="q1", exam_id="e1", question_number="Q1", text="What is an Operating System? Explain its functions.", display_order=1)
    q2 = Question(id="q2", exam_id="e1", question_number="Q2", text="Explain the different types of Operating Systems.", display_order=2)
    q3 = Question(id="q3", exam_id="e1", question_number="Q3", text="What is a Process? Explain the different process states.", display_order=3)
    q4 = Question(id="q4", exam_id="e1", question_number="Q4", text="Differentiate between Process and Thread.", display_order=4)
    q5 = Question(id="q5", exam_id="e1", question_number="Q5", text="What is Deadlock? Explain its four necessary conditions.", display_order=5)
    questions = [q1, q2, q3, q4, q5]

    # Student attended Q1, Q2, Q3, Q4. Q5 was SKIPPED.
    # In Q3, student wrote 5 process states ending with '5. Terminated'.
    script_text = """
    1. Define Operating System and explain its functions.
    An OS is system software managing hardware.
    1. Process Management
    2. Memory Management

    2. Explain the different types of Operating Systems.
    1. Batch OS
    2. Time-sharing OS

    3. What is a Process? Explain the different process states.
    A process is a program in execution.
    1. New - being created
    2. Ready - waiting for CPU
    3. Running - executing
    4. Waiting - waiting for I/O
    5. Terminated - finished execution

    4. Differentiate between Process and Thread.
    Process is heavy, thread is lightweight.
    """

    segments = segment_text_by_questions(script_text, questions)
    assert len(segments) == 5

    # Check Q3 preserved its entire answer including '5. Terminated'
    q3_seg = next(s for s in segments if s["question_id"] == "q3")
    assert "Terminated - finished execution" in q3_seg["text"]

    # Check Q5 is correctly marked as not attempted / blank, NOT stealing '5. Terminated'
    q5_seg = next(s for s in segments if s["question_id"] == "q5")
    assert "[Not Attempted / Blank]" in q5_seg["text"]

def test_irrelevant_answer_marked_wrong_in_ai():
    import json
    from app.services.ai.mock_evaluator import MockAIEvaluator
    from app.models.question import Question, RubricCriterion

    evaluator = MockAIEvaluator()

    q_deadlock = Question(
        id="qd",
        exam_id="e1",
        question_number="Q5",
        text="What is Deadlock? Explain its four necessary conditions.",
        topic="Deadlocks",
        important_concepts_json=json.dumps(["deadlock", "coffman", "mutual exclusion", "hold and wait", "circular wait"]),
        max_marks=5.0
    )
    q_deadlock.rubric_criteria = [
        RubricCriterion(id="rc1", name="Core Definition", max_marks=2.0, expected_concepts_json=json.dumps(["definition"])),
        RubricCriterion(id="rc2", name="Technical Explanation", max_marks=3.0, expected_concepts_json=json.dumps(["mechanism"]))
    ]

    # Student mistakenly or mischievously wrote about Operating Systems under Deadlock
    irrelevant_answer = "Definition: An Operating System is system software that acts as an interface with mechanism for user."

    result = evaluator.evaluate_answer(q_deadlock, irrelevant_answer)

    # MUST be awarded 0.0 marks because it is completely off-topic!
    awarded_sum = sum(c.awarded_marks for c in result.criteria)
    assert awarded_sum == 0.0, f"Expected 0.0 marks for irrelevant answer, got {awarded_sum}"
    assert result.requires_human_review is True
    assert "irrelevant" in result.criteria[0].explanation.lower()

def test_teacher_override_mark_calculation_accuracy(client):
    login_resp = client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    exams_resp = client.get("/api/exams", headers=headers)
    exams = exams_resp.json()
    exam_id = next((e["id"] for e in exams if "Operating Systems" in e["title"]), exams[0]["id"])

    scripts_resp = client.get(f"/api/exams/{exam_id}/scripts", headers=headers)
    scripts = scripts_resp.json()
    assert len(scripts) >= 1
    script_id = scripts[0]["id"]

    # Get evaluation
    eval_resp = client.get(f"/api/scripts/{script_id}/evaluation", headers=headers)
    data = eval_resp.json()
    first_eval = data["evaluations"][0]
    eval_id = first_eval["id"]
    orig_ai = first_eval["original_ai_marks"]

    # Override with exact new mark: 4.5
    target_override = 4.5
    override_resp = client.post(f"/api/evaluations/{eval_id}/override", json={
        "final_marks": target_override,
        "override_reason": "Teacher verified answer quality.",
        "status": "overridden"
    }, headers=headers)
    assert override_resp.status_code == 200

    # Fetch updated script evaluation
    updated_resp = client.get(f"/api/scripts/{script_id}/evaluation", headers=headers)
    updated_data = updated_resp.json()
    updated_eval = next(e for e in updated_data["evaluations"] if e["id"] == eval_id)

    # Verify effective mark is exactly 4.5, not 4.5 + orig_ai!
    assert updated_eval["effective_marks"] == target_override
    assert updated_eval["original_ai_marks"] == orig_ai

    # Verify total_score is the exact sum of all question effective marks!
    expected_total = sum(e["effective_marks"] for e in updated_data["evaluations"])
    assert updated_data["total_score"] == round(expected_total, 2)

def test_question_marker_variants_and_subtopics():
    from app.models.question import Question
    from app.services.answer_segmentation import segment_text_by_questions
    q1 = Question(id="q1", question_number="Q1", text="What is an Operating System? Explain functions.", display_order=1)
    q2 = Question(id="q2", question_number="Q2", text="Explain the different types of Operating Systems.", display_order=2)
    q3 = Question(id="q3", question_number="Q3", text="What is Deadlock? Explain Coffman conditions.", display_order=3)

    # Student uses diverse notation: q.1) Definintion, 2) Types, and skips Q3
    text = """q.1) Definintion
An Operating System acts as an interface between user and hardware.
It manages resources.

2) Types of Operating Systems
Batch OS, Time-sharing OS, Distributed OS.
"""
    results = segment_text_by_questions(text, [q1, q2, q3])
    assert len(results) == 3
    # Q1 must be detected and not blank!
    assert "acts as an interface" in results[0]["text"]
    assert results[0]["text"] != "[Not Attempted / Blank]"
    # Q2 must be detected and not blank!
    assert "Batch OS" in results[1]["text"]
    assert results[1]["text"] != "[Not Attempted / Blank]"
    # Q3 was not attempted and must be marked [Not Attempted / Blank]
    assert results[2]["text"] == "[Not Attempted / Blank]"

def test_multiline_blank_space_question_segmentation():
    from app.models.question import Question
    from app.services.answer_segmentation import segment_text_by_questions
    q1 = Question(id="q1", question_number="Q1", text="What is an Operating System? Explain functions.", display_order=1)
    q2 = Question(id="q2", question_number="Q2", text="Explain the different types of Operating Systems.", display_order=2)

    # Student writes marker on line 1, leaves 2 lines of blank space, then begins answer
    text = """q.1)


Definition:
An Operating System is system software that manages computer hardware and software resources.

2)


Types:
1. Batch Operating System
2. Distributed Operating System
"""
    results = segment_text_by_questions(text, [q1, q2])
    assert len(results) == 2
    assert "manages computer hardware" in results[0]["text"]
    assert results[0]["text"] != "[Not Attempted / Blank]"
    assert "Batch Operating System" in results[1]["text"]
    assert results[1]["text"] != "[Not Attempted / Blank]"

def test_semantic_non_verbatim_rubric_evaluation():
    from app.models.question import Question, RubricCriterion
    from app.services.ai.mock_evaluator import MockAIEvaluator

    crit1 = RubricCriterion(id="c1", name="OS Definition", max_marks=2.0, expected_concepts=["system software", "interface between user and hardware"])
    crit2 = RubricCriterion(id="c2", name="Resource Management", max_marks=3.0, expected_concepts=["controls cpu memory devices", "resource allocation"])
    
    q = Question(
        id="q1",
        question_number="Q1",
        text="Define an Operating System and explain its role in managing hardware resources.",
        max_marks=5.0,
        reference_answer="An Operating System is system software that acts as an interface between user and hardware, allocating CPU, memory, and devices.",
        rubric_criteria=[crit1, crit2]
    )

    # Student uses completely different wording, synonyms, and personal phrasing (NO verbatim matching)
    student_answer = (
        "In computers, an OS acts as a vital bridge connecting humans with the physical computer components. "
        "It supervises and coordinates hardware components like processor time, RAM allocation, and storage equipment."
    )

    evaluator = MockAIEvaluator()
    res = evaluator.evaluate_answer(q, student_answer)

    # Marks must be awarded for conceptual understanding without requiring verbatim repetition!
    total_awarded = sum(c.awarded_marks for c in res.criteria)
    assert total_awarded >= 3.5, f"Expected generous marks for conceptual understanding, got {total_awarded}"
    assert not any(c.awarded_marks == 0.0 for c in res.criteria)

def test_contact_submission_and_admin_inbox(client):
    # 1. Submit contact inquiry
    msg_payload = {
        "name": "Dr. Ramesh Nair",
        "email": "ramesh.nair@nit.edu",
        "subject": "Inquiry regarding multi-page handwritten evaluation",
        "message": "We would like to test ExamLens for semester examinations."
    }
    resp = client.post("/api/contact", json=msg_payload)
    assert resp.status_code == 200
    created_msg = resp.json()
    assert created_msg["name"] == "Dr. Ramesh Nair"
    assert created_msg["status"] == "unread"

    # 2. Login as admin
    admin_login = client.post("/api/auth/login", json={"email": "admin@examlens.edu", "password": "examlens123"})
    assert admin_login.status_code == 200
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Retrieve messages via admin endpoint
    inbox_resp = client.get("/api/admin/messages", headers=headers)
    assert inbox_resp.status_code == 200
    inbox = inbox_resp.json()
    assert any(m["email"] == "ramesh.nair@nit.edu" for m in inbox)

    # 4. Update status
    patch_resp = client.patch(f"/api/admin/messages/{created_msg['id']}", json={"status": "replied"}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "replied"

def test_admin_custom_credentials_login(client):
    """Verify admin login with designated email and password 94865."""
    login_resp = client.post("/api/auth/login", json={
        "email": "sharveshofficialmicro@gmail.com",
        "password": "94865"
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "sharveshofficialmicro@gmail.com"

def test_trial_otp_request_and_verification(client):
    """Verify 30-day trial Email OTP dispatch, password creation, and instant user provisioning."""
    # 1. Request OTP via email
    req_resp = client.post("/api/trial/request-otp", json={
        "full_name": "Dean Alistair",
        "email": "dean.alistair@cambridge.edu",
        "password": "cambridgeSecurePass123",
        "institution": "University of Cambridge"
    })
    assert req_resp.status_code == 200
    data = req_resp.json()
    assert data["success"] is True
    assert data["sender_email"] == "examlenses@gmail.com"
    demo_otp = data["demo_otp"]
    assert len(demo_otp) == 6

    # 2. Verify with valid OTP and verify auto-provisioned user + JWT token
    verify_resp = client.post("/api/trial/verify-otp", json={
        "email": "dean.alistair@cambridge.edu",
        "otp_code": demo_otp
    })
    assert verify_resp.status_code == 200
    vdata = verify_resp.json()
    assert vdata["success"] is True
    assert vdata["trial_status"] == "active"
    assert vdata["trial_days_remaining"] == 30
    assert vdata["institution"] == "University of Cambridge"
    assert "access_token" in vdata and len(vdata["access_token"]) > 20

    # 3. Verify user can now sign in with their created password
    login_resp = client.post("/api/auth/login", json={
        "email": "dean.alistair@cambridge.edu",
        "password": "cambridgeSecurePass123"
    })
    assert login_resp.status_code == 200
    ldata = login_resp.json()
    assert ldata["user"]["institution"] == "University of Cambridge"
    assert ldata["user"]["email"] == "dean.alistair@cambridge.edu"

def test_password_reset_flow(client):
    """Verify password reset via email for forgotten passwords."""
    # 1. Reset password for existing teacher
    reset_resp = client.post("/api/auth/reset-password", json={
        "email": "teacher@examlens.edu",
        "new_password": "newSuperPassword99"
    })
    assert reset_resp.status_code == 200
    rdata = reset_resp.json()
    assert rdata["success"] is True

    # 2. Old password fails
    old_login = client.post("/api/auth/login", json={
        "email": "teacher@examlens.edu",
        "password": "examlens123"
    })
    assert old_login.status_code == 401

    # 3. New password succeeds
    new_login = client.post("/api/auth/login", json={
        "email": "teacher@examlens.edu",
        "password": "newSuperPassword99"
    })
    assert new_login.status_code == 200
    assert new_login.json()["user"]["email"] == "teacher@examlens.edu"

    # Reset back for other tests
    client.post("/api/auth/reset-password", json={
        "email": "teacher@examlens.edu",
        "new_password": "examlens123"
    })







