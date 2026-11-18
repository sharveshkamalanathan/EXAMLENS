import subprocess
import time
import requests
import sys

print("Starting uvicorn server process...", flush=True)
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=r"C:\Users\sharv\.gemini\antigravity\scratch\ExamLens\backend"
)

try:
    time.sleep(2.5)
    print("Probing http://127.0.0.1:8000/ ...", flush=True)
    r = requests.get("http://127.0.0.1:8000/", timeout=5)
    print("Root response:", r.status_code, r.json(), flush=True)
    assert r.status_code == 200

    print("Probing /api/system/status ...", flush=True)
    r_sys = requests.get("http://127.0.0.1:8000/api/system/status", timeout=5)
    print("System status:", r_sys.status_code, r_sys.json()["ocr"], flush=True)
    assert r_sys.status_code == 200

    print("Probing /api/auth/login ...", flush=True)
    r_login = requests.post("http://127.0.0.1:8000/api/auth/login", json={
        "email": "teacher@examlens.edu",
        "password": "examlens123"
    }, timeout=5)
    print("Login status:", r_login.status_code, r_login.json()["user"]["full_name"], flush=True)
    assert r_login.status_code == 200
    token = r_login.json()["access_token"]

    print("Probing /api/exams ...", flush=True)
    r_exams = requests.get("http://127.0.0.1:8000/api/exams", headers={"Authorization": f"Bearer {token}"}, timeout=5)
    print("Exams loaded:", len(r_exams.json()), flush=True)
    assert len(r_exams.json()) >= 2

    print("\n>>> LIVE SERVER PROBE TEST PASSED 100%! <<<", flush=True)
finally:
    print("Terminating server process...", flush=True)
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except Exception:
        proc.kill()
    print("Server cleanly stopped.")
