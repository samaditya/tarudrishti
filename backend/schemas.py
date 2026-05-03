from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional
from enum import Enum

# =============================================================================
# Plant Schemas
# =============================================================================
class PlantBase(BaseModel):
    """
    Base Pydantic schema containing common attributes for a Plant.
    """
    name: str
    species: str
    image_url: Optional[str] = None

class PlantCreate(PlantBase):
    """
    Schema used for validating data when creating a new Plant.
    """
    pass

class PlantResponse(PlantBase):
    """
    Schema used for serializing Plant output data back to the client.
    """
    id: int
    health_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PlantDetailResponse(PlantResponse):
    """
    Extended schema that includes nested care logs for the profile view.
    """
    care_logs: list["CareLogResponse"] = []

    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Care Log Schemas
# =============================================================================
class CareLogBase(BaseModel):
    action_type: str
    substance_used: Optional[str] = None
    action_date: datetime

class CareLogCreate(CareLogBase):
    plant_id: int

class CareLogResponse(CareLogBase):
    id: int
    plant_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# AI Orchestrator & Extraction Schemas
# =============================================================================
class IntentType(str, Enum):
    LOG_CARE = "LOG_CARE"
    DIAGNOSE_PLANT = "DIAGNOSE_PLANT"
    GENERAL_CHAT = "GENERAL_CHAT"
    ADD_PLANT = "ADD_PLANT"
    DELETE_PLANT = "DELETE_PLANT"

class IntentClassification(BaseModel):
    """
    Model used by the Router Agent to classify user intent.
    """
    intent: IntentType = Field(
        ...,
        description="LOG_CARE: user states they watered/fertilized/pruned a plant. DIAGNOSE_PLANT: user uploads an image, asks for identification, or asks if a plant is healthy/sick. ADD_PLANT: user wants to save or add a plant. DELETE_PLANT: user wants to remove or delete a plant. GENERAL_CHAT: general text questions."
    )
    confidence_score: float = Field(
        ...,
        description="Confidence score of the classification between 0.0 and 1.0.",
        ge=0.0,
        le=1.0
    )

class PlantExtraction(BaseModel):
    """
    Strictly typed Pydantic model for extracting a new plant's details (Add Plant Agent).
    """
    name: str = Field(
        ..., 
        description="The common name or a custom nickname for the plant (e.g., 'My Bedroom Pothos', 'Snake Plant')."
    )
    species: str = Field(
        ..., 
        description="The scientific or common species name of the plant (e.g., 'Epipremnum aureum', 'Sansevieria')."
    )

class DeletePlantExtraction(BaseModel):
    """
    Strictly typed Pydantic model for extracting the name of the plant to delete.
    """
    plant_name_or_species: str = Field(
        ..., 
        description="The name or species of the plant the user wants to delete."
    )

class SingleCareAction(BaseModel):
    plant_name_or_species: str = Field(
        ..., 
        description="The name or species of the plant mentioned. If the user implies all their plants, exactly use the string 'ALL_PLANTS'."
    )
    action_type: str = Field(
        ..., 
        description="The type of care action performed. Standardize to terms like 'Water', 'Fertilize', 'Pesticide', 'Repot', or 'Prune'."
    )
    substance_used: Optional[str] = Field(
        None, 
        description="Any specific substance used during the action, such as 'NPK 10-10-10' or 'Neem Oil'."
    )
    action_date: date = Field(
        ..., 
        description="The date the action occurred. Deduce this based on the provided current date and user input (e.g., 'yesterday', 'today')."
    )

class CareLogExtraction(BaseModel):
    """
    Strictly typed Pydantic model for OpenAI structured output extraction (Logger Agent).
    """
    actions: list[SingleCareAction] = Field(
        ...,
        description="A list of care actions extracted from the user's input."
    )

class ChatRequest(BaseModel):
    """
    API Input schema for the chat orchestrator endpoint.
    """
    user_message: str
    current_date: str = Field(..., description="The current date in YYYY-MM-DD format to give the LLM temporal context.")
    image_base64: Optional[str] = Field(
        None, 
        description="Raw base64-encoded string of a plant image for diagnosis. Omit the 'data:image/jpeg;base64,' prefix."
    )
    history: list[dict[str, str]] = Field(
        default_factory=list,
        description="List of previous conversation messages in OpenAI format [{'role': '...', 'content': '...'}]"
    )
    weather_context: Optional[str] = Field(
        None,
        description="String describing current local weather conditions for contextual advice."
    )
