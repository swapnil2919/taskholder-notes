from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_main_db, get_cached_engine_factory
from ..models.user import User
from .jwt import verify_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_main_db),
) -> User:
    token = credentials.credentials
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def get_user_db(
    current_user: User = Depends(get_current_user),
    main_db: AsyncSession = Depends(get_main_db),
):
    from ..models.db_config import DBConfig
    if not current_user.active_db_config_id:
        raise HTTPException(
            status_code=503,
            detail="No active database configured. Please add and activate a database in settings.",
        )
    result = await main_db.execute(
        select(DBConfig).where(
            DBConfig.id == current_user.active_db_config_id,
            DBConfig.user_id == current_user.id,
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=503, detail="Active database config not found.")
    _, factory = get_cached_engine_factory(config.url)
    async with factory() as session:
        try:
            yield session
        finally:
            await session.close()
