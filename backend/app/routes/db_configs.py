import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select, text
from ..database import get_main_db, get_cached_engine_factory, Base
from ..models.db_config import DBConfig
from ..models.user import User
from ..auth.deps import get_current_user

router = APIRouter(prefix="/db-configs", tags=["Database Configs"])


def _parse_host(url: str) -> str:
    try:
        return url.split("@")[-1].split("/")[0]
    except Exception:
        return "unknown"


async def _test_and_setup_user_db(url: str) -> int:
    """Validate connection, create tasks/notes tables, return size_bytes."""
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
async def list_configs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_main_db),
):
    result = await db.execute(
        select(DBConfig)
        .where(DBConfig.user_id == current_user.id)
        .order_by(DBConfig.created_at)
    )
    configs = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "host": c.host,
            "is_active": c.id == current_user.active_db_config_id,
        }
        for c in configs
    ]


@router.post("", status_code=201)
async def add_config(
    req: DBConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_main_db),
):
    name = req.name.strip()
    url = req.url.strip()

    if not name:
        raise HTTPException(400, detail={"type": "validation_error", "message": "Database name is required."})

    if not url.startswith("postgresql+asyncpg://"):
        raise HTTPException(
            400,
            detail={"type": "invalid_url", "message": "URL must start with postgresql+asyncpg://"},
        )

    existing = await db.execute(
        select(DBConfig).where(DBConfig.user_id == current_user.id, DBConfig.name.ilike(name))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, detail={"type": "duplicate_name", "message": f'A database named "{name}" already exists.'})

    size_bytes = await _test_and_setup_user_db(url)
    host = _parse_host(url)

    config = DBConfig(id=uuid.uuid4(), user_id=current_user.id, name=name, url=url, host=host)
    db.add(config)
    await db.commit()
    await db.refresh(config)

    # Auto-activate if this is the user's first config
    if not current_user.active_db_config_id:
        current_user.active_db_config_id = config.id
        await db.commit()
        await db.refresh(current_user)

    return {
        "id": str(config.id),
        "name": config.name,
        "host": config.host,
        "size_mb": round(size_bytes / (1024 * 1024), 2),
        "is_active": current_user.active_db_config_id == config.id,
    }


@router.delete("/{config_id}", status_code=204)
async def delete_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_main_db),
):
    result = await db.execute(
        select(DBConfig).where(DBConfig.id == config_id, DBConfig.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(404, detail="Config not found")

    if str(current_user.active_db_config_id) == config_id:
        current_user.active_db_config_id = None
        await db.commit()

    await db.delete(config)
    await db.commit()


@router.post("/{config_id}/activate")
async def activate_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_main_db),
):
    result = await db.execute(
        select(DBConfig).where(DBConfig.id == config_id, DBConfig.user_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(404, detail="Config not found")

    await _test_and_setup_user_db(config.url)
    get_cached_engine_factory(config.url)

    already_active = str(current_user.active_db_config_id) == config_id
    if not already_active:
        current_user.active_db_config_id = config.id
        await db.commit()

    return {"message": f"Switched to '{config.name}'", "already_active": already_active}
