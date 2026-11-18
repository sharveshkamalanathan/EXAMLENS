import sys
from app.main import app
from starlette.testclient import TestClient

print("Creating TestClient...")
with TestClient(app) as client:
    print("Calling GET / ...")
    r = client.get("/")
    print("Response:", r.status_code, r.json())
print("Done!")
