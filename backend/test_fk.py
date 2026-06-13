from database import engine
from sqlalchemy import text
with engine.connect() as conn:
    tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
    for (t,) in tables:
        fks = conn.execute(text(f"PRAGMA foreign_key_list({t});")).fetchall()
        for fk in fks:
            # fk: (id, seq, table, from, to, on_update, on_delete, match)
            if fk[2] == 'users' and fk[6] != 'CASCADE':
                print(f"Table {t} -> users.id is {fk[6]}")
