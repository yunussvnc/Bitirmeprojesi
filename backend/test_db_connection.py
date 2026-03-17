import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy import text
from config import get_settings
from database import engine, SessionLocal

settings = get_settings()
print("URL:", settings.DATABASE_URL)

try:
    with engine.connect() as conn:
        val = conn.execute(text("SELECT 1")).scalar()
        print("Test 1 Engine:", "OK" if val == 1 else "FAIL")
except Exception as e:
    print("Test 1 Engine: FAIL -", e)
    sys.exit(1)

try:
    db = SessionLocal()
    val = db.execute(text("SELECT 1")).scalar()
    print("Test 2 Session:", "OK" if val == 1 else "FAIL")
    db.close()
except Exception as e:
    print("Test 2 Session: FAIL -", e)
    sys.exit(1)

try:
    with engine.connect() as conn:
        ver = conn.execute(text("SELECT version()")).scalar()
        dbname = conn.execute(text("SELECT current_database()")).scalar()
        user = conn.execute(text("SELECT current_user")).scalar()
        print("PostgreSQL:", ver)
        print("Database:", dbname)
        print("User:", user)
except Exception as e:
    print("Info: FAIL -", e)

try:
    with engine.connect() as conn:
        tables = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema='public' ORDER BY table_name"
        )).fetchall()
        print("Tables:", len(tables))
        for t in tables:
            print(" -", t[0])
except Exception as e:
    print("Tables: FAIL -", e)

print("DONE")
