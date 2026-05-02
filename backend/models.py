from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

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
