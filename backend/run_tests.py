import os
os.environ["TESTING"] = "1"

import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.services.seed_data import seed_database

print("1. Creating tables in SQLite...")
Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    print("2. Seeding database...")
    seed_database(db)
    print("Database seeded successfully.")
finally:
    db.close()

print("3. Testing client endpoints...")
client = TestClient(app)

resp = client.get("/")
print("Root status:", resp.status_code, resp.json())
assert resp.status_code == 200

# Test Teacher Login
login_resp = client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
print("Teacher login:", login_resp.status_code)
assert login_resp.status_code == 200
token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Test Exams list
exams_resp = client.get("/api/exams", headers=headers)
print("Exams list:", exams_resp.status_code, f"{len(exams_resp.json())} exams")
assert exams_resp.status_code == 200
assert len(exams_resp.json()) >= 1

exam_id = exams_resp.json()[0]["id"]

# Test Question rubric validation
bad_q_resp = client.post(f"/api/exams/{exam_id}/questions", json={
    "question_number": "Q9",
    "text": "Rubric test",
    "max_marks": 5.0,
    "reference_answer": "test",
    "rubric_criteria": [{"name": "C1", "max_marks": 2.0}]
}, headers=headers)
print("Bad rubric status (should be 400):", bad_q_resp.status_code)
assert bad_q_resp.status_code == 400

# Test Scripts & Evaluation
scripts_resp = client.get(f"/api/exams/{exam_id}/scripts", headers=headers)
print("Scripts status:", scripts_resp.status_code, f"{len(scripts_resp.json())} scripts")
assert scripts_resp.status_code == 200
scripts = scripts_resp.json()
script_id = scripts[0]["id"]

eval_resp = client.get(f"/api/scripts/{script_id}/evaluation", headers=headers)
print("Script evaluation status:", eval_resp.status_code)
assert eval_resp.status_code == 200
eval_data = eval_resp.json()
eval_id = eval_data["evaluations"][0]["id"]
orig_marks = eval_data["evaluations"][0]["original_ai_marks"]

# Test Override
override_resp = client.post(f"/api/evaluations/{eval_id}/override", json={
    "final_marks": min(5.0, orig_marks + 0.5),
    "override_reason": "Teacher adjusted marks",
    "status": "overridden"
}, headers=headers)
print("Override status:", override_resp.status_code, override_resp.json()["final_marks"])
assert override_resp.status_code == 200
assert override_resp.json()["original_ai_marks"] == orig_marks

# Test Student Access
stu_login = client.post("/api/auth/login", json={"email": "stu101@examlens.edu", "password": "examlens123"})
assert stu_login.status_code == 200
stu_token = stu_login.json()["access_token"]
stu_headers = {"Authorization": f"Bearer {stu_token}"}

stu_results = client.get("/api/student/results", headers=stu_headers)
print("Student results:", stu_results.status_code, f"{len(stu_results.json())} published results")
assert stu_results.status_code == 200
assert len(stu_results.json()) >= 1

print("\n>>> ALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY! <<<")
