from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, tasks, notes
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

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "TaskHolder Notes API", "version": "1.0.0", "docs": "/api/docs"}
