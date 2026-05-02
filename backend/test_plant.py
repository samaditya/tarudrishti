from database import SessionLocal
from main import read_plant
from schemas import PlantDetailResponse

db = SessionLocal()
try:
    plant = read_plant(1, db)
    print("Plant:", plant)
    # Test Pydantic serialization
    validated = PlantDetailResponse.model_validate(plant)
    print("Validated:", validated)
except Exception as e:
    import traceback
    traceback.print_exc()
