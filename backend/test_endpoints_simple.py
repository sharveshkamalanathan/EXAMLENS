import os
import sys
import asyncio
import httpx
from app.main import app

async def run():
    print("Step 1: Starting AsyncClient...", flush=True)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("Step 2: Sending GET / ...", flush=True)
        r = await client.get("/")
        print("Step 3: Received response:", r.status_code, r.json(), flush=True)

        print("Step 4: Logging in as teacher...", flush=True)
        r = await client.post("/api/auth/login", json={"email": "teacher@examlens.edu", "password": "examlens123"})
        print("Step 5: Login response:", r.status_code, flush=True)
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("Step 6: Fetching exams...", flush=True)
        r = await client.get("/api/exams", headers=headers)
        print("Step 7: Exams count:", len(r.json()), flush=True)

if __name__ == "__main__":
    asyncio.run(run())
