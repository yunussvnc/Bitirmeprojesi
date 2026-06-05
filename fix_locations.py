import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# We'll use absolute path for the sqlite DB
db_path = "sqlite:////Users/ulascandemirtas/Projects/bitirme/Bitirmeprojesi/backend/data/places.db"
engine = create_engine(db_path)
Session = sessionmaker(bind=engine)
session = Session()

# Wait, the DB is actually postgres based on earlier logs
