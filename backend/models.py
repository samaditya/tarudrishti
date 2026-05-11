from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    plants = relationship("Plant", back_populates="owner", cascade="all, delete-orphan")

class Plant(Base):
    """
    Represents a specific plant in the user's garden.
    """
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    health_status = Column(String, default="Healthy", nullable=False)
    image_url = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Bidirectional relationship with User
    owner = relationship("User", back_populates="plants")

    # One-to-Many relationship: A plant can have many care logs.
    care_logs = relationship("CareLog", back_populates="plant", cascade="all, delete-orphan")


class CareLog(Base):
    """
    Represents an action taken for a specific plant (e.g., Watering, Fertilizing).
    """
    __tablename__ = "care_logs"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    
    # "Water", "Fertilize", "Pesticide", etc.
    action_type = Column(String, nullable=False)
    
    # E.g., "NPK 10-10-10", "Neem Oil" (can be null for watering)
    substance_used = Column(String, nullable=True)
    
    action_date = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Bidirectional relationship back to Plant
    plant = relationship("Plant", back_populates="care_logs")

class SemanticCache(Base):
    """
    Stores past LLM responses based on semantic query embedding to reduce redundant inference.
    """
    __tablename__ = "semantic_cache"

    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(String, nullable=False)
    response_text = Column(String, nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
