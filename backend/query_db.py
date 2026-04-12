from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('postgresql://postgres:123@localhost:5432/ai_mekan_oneri_db')
Session = sessionmaker(bind=engine)
session = Session()
result = session.execute(text('SELECT email FROM users WHERE role = \'venue\' LIMIT 3'))
for row in result:
    print(row)
