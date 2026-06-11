from datetime import timedelta
from pathlib import Path
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select, text
from ..database import get_db, db_manager, Base
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, UserResponse, Token, DBConnectRequest
from ..auth.jwt import create_access_token
from ..auth.deps import get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _update_env_db_url(new_url: str):
    """Persist DATABASE_URL into the backend .env file."""
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


@router.post("/validate-db")
async def validate_db(req: DBConnectRequest):
    """Validate DB URL, check storage, auto-create tables, and persist."""
    db_url = req.db_url.strip()

    if not db_url.startswith("postgresql+asyncpg://"):
        raise HTTPException(
            status_code=400,
            detail={
                "type": "invalid_url",
                "message": "URL must start with postgresql+asyncpg://",
            },
        )

    # Test connection and read DB size
    test_engine = None
    try:
        test_engine = create_async_engine(db_url, connect_args={"ssl": "require"}, echo=False)
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            result = await conn.execute(text("SELECT pg_database_size(current_database())"))
            size_bytes = result.scalar()
    except Exception:
        if test_engine:
            await test_engine.dispose()
        raise HTTPException(
            status_code=400,
            detail={
                "type": "connection_error",
                "message": "DB connection could not be established. Please enter valid credentials.",
            },
        )

    # Check if storage is >= 95% of 500 MB
    if size_bytes >= int(500 * 1024 * 1024 * 0.95):
        await test_engine.dispose()
        raise HTTPException(
            status_code=400,
            detail={
                "type": "db_full",
                "message": "Database storage is full. Please create a new database on Neon.",
            },
        )

    # Create / migrate tables on the new database
    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(
                text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_api_token VARCHAR UNIQUE")
            )
            await conn.execute(
                text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_script_last_seen TIMESTAMPTZ")
            )
    except Exception as exc:
        await test_engine.dispose()
        raise HTTPException(
            status_code=500,
            detail={
                "type": "setup_error",
                "message": f"Failed to set up database tables: {exc}",
            },
        )

    await test_engine.dispose()

    # Switch the live connection and persist to .env
    db_manager.init(db_url)
    _update_env_db_url(db_url)

    return {
        "message": "Database connected and configured successfully",
        "size_bytes": size_bytes,
        "size_mb": round(size_bytes / (1024 * 1024), 2),
    }


@router.get("/db-status")
async def db_status():
    """Return current DB connection info."""
    if not db_manager.configured or not db_manager.db_url:
        return {"configured": False, "host": None, "size_mb": None, "limit_mb": 500}

    # Parse host from URL
    try:
        host = db_manager.db_url.split("@")[-1].split("/")[0]
    except Exception:
        host = "unknown"

    # Read current size
    size_mb = None
    try:
        async with db_manager.engine.connect() as conn:
            result = await conn.execute(text("SELECT pg_database_size(current_database())"))
            size_bytes = result.scalar()
            size_mb = round(size_bytes / (1024 * 1024), 2)
    except Exception:
        pass

    return {"configured": True, "host": host, "size_mb": size_mb, "limit_mb": 500}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
