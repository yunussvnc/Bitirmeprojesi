from app.database import SessionLocal
from app.models import User
from app.routers.auth import delete_account
from fastapi import Request

db = SessionLocal()
u = db.query(User).filter_by(email="test@example.com").first()
if not u:
    print("User not found")
else:
    try:
        res = delete_account(current_user=u, db=db)
        print("Success:", res)
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()
