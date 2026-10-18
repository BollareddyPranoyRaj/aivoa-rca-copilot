import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    try:
        # Try primary PostgreSQL connection
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            echo=False,
            future=True
        )
        with engine.connect() as conn:
            logger.info("Connected successfully to PostgreSQL database.")
        return engine
    except Exception as e:
        logger.warning(f"Failed to connect to primary database ({e}). Falling back to SQLite.")
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
            echo=False,
            future=True
        )
        return sqlite_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
