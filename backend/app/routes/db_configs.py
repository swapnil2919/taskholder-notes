import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from ..database import db_manager, Base

router = APIRouter(prefix="/db-configs", tags=["Database Configs"])

CONFIGS_FILE = Path(__file__).resolve().parent.parent.parent / "db_configs.json"


def load_configs() -> list[dict]:
    if not CONFIGS_FILE.exists():
        return []
    try:
        return json.loads(CONFIGS_FILE.read_text())
    except Exception:
        return []


def save_configs(configs: list[dict]):
    CONFIGS_FILE.write_text(json.dumps(configs, indent=2))


def update_env_db_url(new_url: str):
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        lines = env_path.read_text().splitlines()
        new_lines, found = [], False
        for line in lines:
            if line.startswith("DATABASE_URL="):
                new_lines.append(f"DATABASE_URL={new_url}")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"DATABASE_URL={new_url}")
        env_path.write_text("\n".join(new_lines) + "\n")


def _parse_host(url: str) -> str:
    try:
        return url.split("@")[-1].split("/")[0]
    except Exception:
        return "unknown"


async def _test_and_setup(url: str) -> int:
    """Connect, return size_bytes. Raises HTTPException on failure."""
    test_engine = None
    try:
        test_engine = create_async_engine(url, connect_args={"ssl": "require"}, echo=False)
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            result = await conn.execute(text("SELECT pg_database_size(current_database())"))
            size_bytes = result.scalar()
    except Exception:
        if test_engine:
            await test_engine.dispose()
        raise HTTPException(
            status_code=400,
            detail={"type": "connection_error", "message": "DB connection could not be established. Please check your credentials."},
        )

    if size_bytes >= int(500 * 1024 * 1024 * 0.95):
        await test_engine.dispose()
        raise HTTPException(
            status_code=400,
            detail={"type": "db_full", "message": "Database storage is full. Please create a new database on Neon."},
        )

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_api_token VARCHAR UNIQUE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_script_last_seen TIMESTAMPTZ"))
    except Exception as exc:
        await test_engine.dispose()
        raise HTTPException(
            status_code=500,
            detail={"type": "setup_error", "message": f"Table setup failed: {exc}"},
        )

    await test_engine.dispose()
    return size_bytes


class DBConfigCreate(BaseModel):
    name: str
    url: str


@router.get("")
async def list_configs():
    configs = load_configs()
    active_url = db_manager.db_url
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "host": c["host"],
            "is_active": c["url"] == active_url,
        }
        for c in configs
    ]


@router.post("", status_code=201)
async def add_config(req: DBConfigCreate):
    name = req.name.strip()
    url = req.url.strip()

    if not name:
        raise HTTPException(400, detail={"type": "validation_error", "message": "Database name is required."})

    if not url.startswith("postgresql+asyncpg://"):
        raise HTTPException(
            400,
            detail={"type": "invalid_url", "message": "URL must start with postgresql+asyncpg://"},
        )

    # Check for duplicate name
    configs = load_configs()
    if any(c["name"].lower() == name.lower() for c in configs):
        raise HTTPException(400, detail={"type": "duplicate_name", "message": f'A database named "{name}" already exists.'})

    size_bytes = await _test_and_setup(url)

    host = _parse_host(url)
    new_config = {
        "id": str(uuid.uuid4()),
        "name": name,
        "url": url,
        "host": host,
        "size_mb": round(size_bytes / (1024 * 1024), 2),
    }
    configs.append(new_config)
    save_configs(configs)

    return {"id": new_config["id"], "name": name, "host": host, "size_mb": new_config["size_mb"]}


@router.delete("/{config_id}", status_code=204)
async def delete_config(config_id: str):
    configs = load_configs()
    new_configs = [c for c in configs if c["id"] != config_id]
    if len(new_configs) == len(configs):
        raise HTTPException(404, detail="Config not found")
    save_configs(new_configs)


@router.post("/{config_id}/activate")
async def activate_config(config_id: str):
    configs = load_configs()
    config = next((c for c in configs if c["id"] == config_id), None)
    if not config:
        raise HTTPException(404, detail="Config not found")

    # Already active — skip re-init
    if db_manager.db_url == config["url"]:
        return {"message": f"Already connected to '{config['name']}'", "already_active": True}

    await _test_and_setup(config["url"])

    db_manager.init(config["url"])
    update_env_db_url(config["url"])

    return {"message": f"Switched to '{config['name']}'", "already_active": False}
