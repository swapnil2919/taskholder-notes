from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class _DBManager:
    def __init__(self):
        self.engine = None
        self._factory = None
        self.db_url: str | None = None

    def init(self, url: str):
        self.db_url = url
        self.engine = create_async_engine(url, connect_args={"ssl": "require"}, echo=False)
        self._factory = async_sessionmaker(self.engine, expire_on_commit=False)

    @property
    def configured(self) -> bool:
        return self.engine is not None


db_manager = _DBManager()


async def get_db() -> AsyncSession:
    if db_manager._factory is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Please set up the database connection on the login page.",
        )
    async with db_manager._factory() as session:
        try:
            yield session
        finally:
            await session.close()
