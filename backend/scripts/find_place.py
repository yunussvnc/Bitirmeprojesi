import sys, os
sys.path.insert(0, "/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend")
os.chdir("/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend")
from dotenv import load_dotenv
load_dotenv("/Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend/.env")
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

engine = create_engine(os.environ["DATABASE_URL"])
with Session(engine) as db:
    r = db.execute(text("SELECT id, name FROM places WHERE LOWER(name) LIKE '%jarn%' OR LOWER(name) LIKE '%coffee%' LIMIT 20"))
    rows = r.fetchall()
    if rows:
        for row in rows:
            print(f"  id={row[0]}  name={row[1]}")
    else:
        print("Jarn/coffee bulunamadı, ilk 30 mekan:")
        r2 = db.execute(text("SELECT id, name FROM places LIMIT 30"))
        for row in r2.fetchall():
            print(f"  id={row[0]}  name={row[1]}")
