import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from database import engine
from migrate import schema_patch_status


def main() -> None:
    if engine.dialect.name != "postgresql":
        raise SystemExit(f"Expected PostgreSQL, got {engine.dialect.name}")

    status = schema_patch_status()
    missing = [name for name, exists in status.items() if not exists]
    if missing:
        raise SystemExit(f"Missing migrated columns: {', '.join(missing)}")

    print("PostgreSQL dialect and critical schema patches verified.")


if __name__ == "__main__":
    main()
