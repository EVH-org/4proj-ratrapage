import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

_log = logging.getLogger(__name__)

def get_db():
    sess = SessionLocal()
    try:
        yield sess
    finally:
        sess.close()