import requests
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_missing_places():
    response = requests.get('http://localhost:8000/places/?limit=1000')
    if response.status_code == 200:
        places = response.json()['items']
        return [p for p in places if p.get('latitude') is None or p.get('longitude') is None]
    return []

missing = get_missing_places()
for p in missing:
    print(json.dumps(p, indent=2))
