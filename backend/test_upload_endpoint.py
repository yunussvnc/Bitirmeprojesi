from dotenv import load_dotenv
load_dotenv(".env")

from fastapi.testclient import TestClient
from main import app
from app.dependencies import get_current_user
from models import User

client = TestClient(app)

def override_get_current_user():
    user = User(id=1, email="test@test.com", username="test")
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

with open("test_dummy.jpg", "wb") as f:
    f.write(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00")

with open("test_dummy.jpg", "rb") as f:
    response = client.post("/api/v1/upload/image", files={"file": ("test.jpg", f, "image/jpeg")})

print(response.status_code)
print(response.json())
