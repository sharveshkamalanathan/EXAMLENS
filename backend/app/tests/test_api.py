import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import Base, get_db
from app.services.seed_data import seed_database

# Test in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
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
    exam_id = exams[0]["id"]

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
