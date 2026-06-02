import sys
from datetime import date
# pyrefly: ignore [missing-import]
from pydantic import ValidationError
from schemas import UserCreate, UserUpdate, FirstTimeSetupRequest

def test_validation():
    errors = []
    print("Testing birth_date validation...")

    # Test 1: Valid date (FirstTimeSetupRequest)
    try:
        req = FirstTimeSetupRequest(username="validuser", birth_date=date(2000, 5, 15))
        print("✅ Valid date (2000-05-15) accepted for FirstTimeSetupRequest.")
    except ValidationError as e:
        errors.append(f"❌ Valid date rejected for FirstTimeSetupRequest: {e}")

    # Test 2: Invalid date too old (FirstTimeSetupRequest)
    try:
        req = FirstTimeSetupRequest(username="olduser", birth_date=date(1000, 1, 1))
        errors.append("❌ Invalid date (1000-01-01) was ACCEPTED! This is a bug.")
    except ValidationError as e:
        if "1950 ile 2023" in str(e):
            print("✅ Invalid date (1000-01-01) rejected properly with correct error message.")
        else:
            errors.append(f"❌ Invalid date (1000) rejected but wrong message: {e}")

    # Test 3: Invalid date too young (FirstTimeSetupRequest)
    try:
        req = FirstTimeSetupRequest(username="younguser", birth_date=date(2025, 1, 1))
        errors.append("❌ Invalid date (2025-01-01) was ACCEPTED! This is a bug.")
    except ValidationError as e:
        if "1950 ile 2023" in str(e):
            print("✅ Invalid date (2025-01-01) rejected properly with correct error message.")
        else:
            errors.append(f"❌ Invalid date (2025) rejected but wrong message: {e}")

    # Test 4: Valid date (UserCreate)
    try:
        req = UserCreate(email="test@test.com", password="pwd", birth_date=date(1995, 1, 1))
        print("✅ Valid date (1995-01-01) accepted for UserCreate.")
    except ValidationError as e:
        errors.append(f"❌ Valid date rejected for UserCreate: {e}")

    # Test 5: Invalid date (UserUpdate)
    try:
        req = UserUpdate(birth_date=date(1949, 12, 31))
        errors.append("❌ Invalid date (1949-12-31) was ACCEPTED for UserUpdate! This is a bug.")
    except ValidationError as e:
        print("✅ Invalid date (1949-12-31) rejected properly for UserUpdate.")

    if errors:
        print("\n--- TESTS FAILED ---")
        for error in errors:
            print(error)
        sys.exit(1)
    else:
        print("\n🚀 ALL TESTS PASSED SUCCESSFULLY! Validation works perfectly.")

if __name__ == "__main__":
    test_validation()
