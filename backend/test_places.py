import sys
import traceback
from database import SessionLocal
import crud

def main():
    db = SessionLocal()
    try:
        items, total = crud.get_places_paginated(db, page=1, page_size=500)
        print("Success:", len(items))
    except Exception as e:
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
