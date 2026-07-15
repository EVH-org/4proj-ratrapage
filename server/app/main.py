from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.routes import auth_router, preferences_router, users_router, cookbooks_router, recipes_router, planning_router

settings = get_settings()

app = FastAPI(title="SUPMEAL API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(preferences_router)
app.include_router(cookbooks_router)
app.include_router(recipes_router)
app.include_router(planning_router)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"db-ok": True}


@app.get("/")
def root():
    return {"service": "supmeal-api", "docs": "/docs"}
