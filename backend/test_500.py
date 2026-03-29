from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
response = client.get("/places/?page=1&page_size=500")
print(response.json())
