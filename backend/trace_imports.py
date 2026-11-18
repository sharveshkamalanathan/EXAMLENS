import sys
import time

def trace():
    t0 = time.time()
    print("1. config")
    from app.core.config import settings
    print(f"   took {time.time()-t0:.2f}s")
    
    t0 = time.time()
    print("2. session")
    from app.database.session import engine, Base
    print(f"   took {time.time()-t0:.2f}s")

    t0 = time.time()
    print("3. models")
    import app.models
    print(f"   took {time.time()-t0:.2f}s")

    t0 = time.time()
    print("4. seed_data")
    from app.services.seed_data import seed_database
    print(f"   took {time.time()-t0:.2f}s")

    t0 = time.time()
    print("5. main app")
    from app.main import app
    print(f"   took {time.time()-t0:.2f}s")

    print("ALL IMPORTS SUCCESSFUL")

if __name__ == "__main__":
    trace()
