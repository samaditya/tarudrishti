import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Assume Neon.tech Postgres URL, fallback to local for dev
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/tarudrishti")

# SQLAlchemy 1.4+ requires "postgresql://" instead of "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Initialize the SQLAlchemy engine
# pool_pre_ping=True prevents "SSL connection has been closed unexpectedly" errors 
# by verifying the connection is still alive before using it.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

# Create pgvector extension
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
except Exception as e:
    print(f"Warning: Could not create pgvector extension: {e}")
    # We don't raise here to allow the app to start even if extension creation fails
    # (e.g. if already created or insufficient permissions)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency to manage database session lifecycle.
    Yields a database session and safely closes it after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
