from database import engine
from sqlalchemy import text
with engine.connect() as conn:
    sql = """
    SELECT
        tc.table_name,
        kcu.column_name,
        rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND rc.delete_rule != 'CASCADE';
    """
    res = conn.execute(text(sql)).fetchall()
    for row in res:
        print(f"Table: {row[0]}, Column: {row[1]}, Rule: {row[2]}")
