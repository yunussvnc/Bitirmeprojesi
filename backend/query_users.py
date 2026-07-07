from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv(".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

result = db.execute(text("SELECT id, username, email FROM users WHERE email LIKE '%serpapi%' LIMIT 5;")).fetchall()
print("Serpapi users:", result)

result2 = db.execute(text("SELECT id, username, email FROM users WHERE email IS NULL LIMIT 5;")).fetchall()
print("Null email users:", result2)

result3 = db.execute(text("SELECT id, username, email FROM users WHERE email NOT LIKE '%serpapi%' LIMIT 5;")).fetchall()
print("Other users:", result3)

