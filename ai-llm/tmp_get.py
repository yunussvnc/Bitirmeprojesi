import sys; sys.path.insert(0, r'd:/BitirmeProjesi/ai-llm')
import os, json
from dotenv import load_dotenv
load_dotenv(r'd:/BitirmeProjesi/ai-llm/.env')
from serpapi_client import SerpApiClient
client = SerpApiClient()
import requests
params = {
    'engine': 'google_maps',
    'q': 'cafe in beşiktaş',
    'll': '@41.0082,28.9784,11z',
    'type': 'search',
    'api_key': client.api_key
}
response = requests.get(client.BASE_URL, params=params)
data = response.json()
with open('c:/temp/serp_res.json', 'w', encoding='utf-8') as f:
    json.dump(data.get('local_results', [])[:2], f, ensure_ascii=False, indent=2)
print("Done")
