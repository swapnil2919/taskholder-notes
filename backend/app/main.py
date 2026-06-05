from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, Base
from .routes import auth, tasks, notes, phone_notifications
from . import models  # noqa: ensure models are registered

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add new columns to existing tables if they don't exist yet
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_api_token VARCHAR UNIQUE"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_script_last_seen TIMESTAMPTZ"
        ))

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(phone_notifications.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "TaskHolder Notes API", "version": "1.0.0", "docs": "/api/docs"}
