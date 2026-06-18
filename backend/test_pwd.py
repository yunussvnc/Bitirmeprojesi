import asyncio
import sys
import uuid
sys.path.append(".")

from schemas import _validate_password_value

def main():
    try:
        pwd = "SocialLogin1!_" + str(uuid.uuid4())
        print(f"Testing password: {pwd}")
        _validate_password_value(pwd)
        print("Success")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    main()
