import time
from app.database.session import Base, engine, SessionLocal
from app.services.seed_data import seed_database

print("Creating tables...", flush=True)
t0 = time.time()
Base.metadata.create_all(bind=engine)
print(f"Tables created in {time.time()-t0:.2f}s", flush=True)

db = SessionLocal()
try:
    print("Seeding database...", flush=True)
    t0 = time.time()
    seed_database(db)
    print(f"Seed complete in {time.time()-t0:.2f}s", flush=True)
finally:
    db.close()
