import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import db_manager, Base
from .routes import auth, tasks, notes, phone_notifications
from .routes import db_configs
from . import models  # noqa: ensure models are registered
from .config import settings

app = FastAPI(title="TaskHolder Notes API", version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    if not settings.DATABASE_URL:
        return

    db_manager.init(settings.DATABASE_URL)

    async with db_manager.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_api_token VARCHAR UNIQUE")
        )
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_script_last_seen TIMESTAMPTZ")
        )

    # Auto-seed db_configs.json with the current .env DB if the list is empty
    configs = db_configs.load_configs()
    if not configs:
        try:
            host = settings.DATABASE_URL.split("@")[-1].split("/")[0]
        except Exception:
            host = "unknown"
        db_configs.save_configs([
            {
                "id": str(uuid.uuid4()),
                "name": "Default DB",
                "url": settings.DATABASE_URL,
                "host": host,
                "size_mb": None,
            }
        ])


app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(phone_notifications.router, prefix="/api")
app.include_router(db_configs.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "TaskHolder Notes API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "db_configured": db_manager.configured,
    }
