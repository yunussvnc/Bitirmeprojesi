from fastapi.testclient import TestClient
import sys
sys.path.append('.')
from main import app
from app.dependencies import get_current_user
from app.models import User

# mock auth
def override_get_current_user():
    return User(id=1, email="test@test.com", username="test")

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)
response = client.get("/api/v1/messages/conversations")
print(response.json())
