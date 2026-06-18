import asyncio
import sys
sys.path.append(".")

from app.middleware.rate_limiter import _record_failed_login_async

async def main():
    try:
        await _record_failed_login_async("127.0.0.1")
        print("Success")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
