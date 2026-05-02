import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Assume Neon.tech Postgres URL, fallback to local for dev
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/tarudrishti")

# Initialize the SQLAlchemy engine
# pool_pre_ping=True prevents "SSL connection has been closed unexpectedly" errors 
# by verifying the connection is still alive before using it.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

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
