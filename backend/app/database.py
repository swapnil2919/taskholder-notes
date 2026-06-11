from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator


class Base(DeclarativeBase):
    """Main DB tables: users, db_configs, phone_notifications."""
    pass


class UserBase(DeclarativeBase):
    """Per-user DB tables: notes, tasks."""
    pass


# ─── Main DB (fixed — users + db_configs + phone_notifications) ───────────────
_main_engine = None
_main_factory = None


def init_main_db(url: str):
    global _main_engine, _main_factory
    _main_engine = create_async_engine(
        url,
        connect_args={"ssl": "require"},
        pool_size=10,
        max_overflow=20,
        echo=False,
    )
    _main_factory = async_sessionmaker(_main_engine, expire_on_commit=False)


async def get_main_db() -> AsyncGenerator[AsyncSession, None]:
    if _main_factory is None:
        from fastapi import HTTPException
        raise HTTPException(503, "Main database not initialized")
    async with _main_factory() as session:
        try:
            yield session
        finally:
            await session.close()


# ─── Per-user DB engine cache (tasks + notes) ─────────────────────────────────
_engine_cache: dict[str, tuple] = {}


def get_cached_engine_factory(url: str):
    if url not in _engine_cache:
        engine = create_async_engine(url, connect_args={"ssl": "require"}, echo=False)
        factory = async_sessionmaker(engine, expire_on_commit=False)
        _engine_cache[url] = (engine, factory)
    return _engine_cache[url]
