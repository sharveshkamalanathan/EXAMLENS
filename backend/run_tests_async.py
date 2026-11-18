import os
os.environ["TESTING"] = "1"

import asyncio
import httpx
from app.main import app

async def main():
    print("Testing API endpoints with AsyncClient...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root
        r = await client.get("/")
        print("1. Root endpoint:", r.status_code, r.json())
        assert r.status_code == 200
        assert r.json()["app"] == "ExamLens"

        # 2. Teacher Login
        login_resp = await client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
        print("2. Teacher login:", login_resp.status_code)
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. System Status
        sys_resp = await client.get("/api/system/status")
        print("3. System status:", sys_resp.status_code, "OCR:", sys_resp.json()["ocr"]["status_label"])
        assert sys_resp.status_code == 200

        # 4. List Exams
        exams_resp = await client.get("/api/exams", headers=headers)
        print("4. Exams count:", len(exams_resp.json()))
        assert exams_resp.status_code == 200
        assert len(exams_resp.json()) >= 2
        exam_id = exams_resp.json()[0]["id"]

        # 5. Rubric criteria sum validation
        bad_q = await client.post(f"/api/exams/{exam_id}/questions", json={
            "question_number": "Q99",
            "text": "Rubric test",
            "max_marks": 5.0,
            "reference_answer": "test",
            "rubric_criteria": [{"name": "C1", "max_marks": 2.0}]
        }, headers=headers)
        print("5. Bad rubric validation rejected (400 expected):", bad_q.status_code)
        assert bad_q.status_code == 400

        # 6. Get Answer Scripts
        scripts_resp = await client.get(f"/api/exams/{exam_id}/scripts", headers=headers)
        scripts = scripts_resp.json()
        print("6. Answer scripts loaded:", len(scripts))
        assert len(scripts) >= 1
        script_id = scripts[0]["id"]

        # 7. Get Evaluation with Criteria & Evidence
        eval_resp = await client.get(f"/api/scripts/{script_id}/evaluation", headers=headers)
        print("7. Script evaluation loaded:", eval_resp.status_code)
        assert eval_resp.status_code == 200
        eval_data = eval_resp.json()
        assert len(eval_data["evaluations"]) >= 1
        first_eval = eval_data["evaluations"][0]
        eval_id = first_eval["id"]
        orig_ai = first_eval["original_ai_marks"]
        print(f"   Evaluated Q: {first_eval['question_number']} | AI Marks: {orig_ai}/{first_eval['maximum_marks']}")

        # 8. Score Override by Teacher
        new_marks = min(first_eval["maximum_marks"], round(orig_ai + 0.5, 2))
        override_resp = await client.post(f"/api/evaluations/{eval_id}/override", json={
            "final_marks": new_marks,
            "override_reason": "Teacher verified alternative conceptual explanation.",
            "teacher_comments": "Well-argued derivation.",
            "status": "overridden"
        }, headers=headers)
        print("8. Teacher override:", override_resp.status_code, "New Marks:", override_resp.json()["final_marks"])
        assert override_resp.status_code == 200
        assert override_resp.json()["original_ai_marks"] == orig_ai  # Original preserved!

        # 9. Audit History
        audit_resp = await client.get(f"/api/evaluations/{eval_id}/audit", headers=headers)
        print("9. Audit trail entries:", len(audit_resp.json()))
        assert len(audit_resp.json()) >= 1

        # 10. Exam Analytics
        analytics_resp = await client.get(f"/api/analytics/exam/{exam_id}", headers=headers)
        print("10. Analytics computed:", analytics_resp.status_code, f"Class Avg: {analytics_resp.json()['average_score']}")
        assert analytics_resp.status_code == 200
        assert len(analytics_resp.json()["score_distribution"]) == 5

        # 11. Student Access Control & Results Portal
        stu_login = await client.post("/api/auth/login", json={"email": "stu101@examlens.edu", "password": "examlens123"})
        assert stu_login.status_code == 200
        stu_token = stu_login.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        stu_res = await client.get("/api/student/results", headers=stu_headers)
        print("11. Student portal published results count:", len(stu_res.json()))
        assert stu_res.status_code == 200
        assert len(stu_res.json()) >= 1
        print(f"   Student Score: {stu_res.json()[0]['student_score']}/{stu_res.json()[0]['total_marks']} ({stu_res.json()[0]['percentage']}%)")

        # 12. CSV Export
        csv_resp = await client.get(f"/api/analytics/exam/{exam_id}/export-csv", headers=headers)
        print("12. CSV Export generated:", csv_resp.status_code, f"{len(csv_resp.text)} bytes")
        assert csv_resp.status_code == 200
        assert "Roll No" in csv_resp.text

    print("\n=======================================================")
    print(">>> ALL 12 END-TO-END BACKEND TEST SUITES PASSED! <<<")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(main())
