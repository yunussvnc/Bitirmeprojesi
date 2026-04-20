from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()
result = session.execute(text('SELECT email FROM users WHERE role = \'venue\' LIMIT 3'))
for row in result:
    print(row)
