import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import init_main_db, Base
from . import database as db_module
from .routes import auth, tasks, notes, phone_notifications
from .routes import db_configs
from . import models  # noqa: ensure all models are registered
from .config import settings

app = FastAPI(title="TaskHolder Notes API", version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _setup_db():
    """Create tables if missing, ensure schema columns exist. Runs in background."""
    try:
        async with db_module._main_engine.connect() as conn:
            result = await conn.execute(
                text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users'")
            )
            tables_exist = result.scalar() > 0

        async with db_module._main_engine.begin() as conn:
            if not tables_exist:
                await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS active_db_config_id UUID"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_api_token VARCHAR UNIQUE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_script_last_seen TIMESTAMPTZ"))
    except Exception as e:
        print(f"[DB setup error] {e}")


@app.on_event("startup")
async def startup():
    init_main_db(settings.MAIN_DATABASE_URL)
    asyncio.create_task(_setup_db())


app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(phone_notifications.router, prefix="/api")
app.include_router(db_configs.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "TaskHolder Notes API", "version": "1.0.0", "docs": "/api/docs"}
