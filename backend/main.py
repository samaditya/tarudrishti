import os
from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from typing import List
from openai import OpenAI
from langchain_core.messages import HumanMessage, AIMessage
from graph import tarudrishti_app

from database import engine, Base, get_db
import models
import schemas

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import mailer
import auth
import scheduler
from fastapi.security import OAuth2PasswordRequestForm

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the scheduler
    # Startup: Initialize the scheduler
    scheduler.start_scheduler()
    
    yield
    # Shutdown
    # Shutdown logic if needed (optional)

# Initialize the FastAPI app
app = FastAPI(title="Tarudrishti API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "*" # Allow wildcard for easy deployment on Vercel/Render
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Auto-generate the database tables based on our declarative models.
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Tarudrishti Botanical Engine Active"
    }

@app.get("/api/test-mailer")
def test_mailer():
    """
    Test endpoint to instantly trigger the email notification agent.
    """
    mailer.check_and_send_daily_notifications()
    return {"status": "success", "message": "Mailer job triggered in background."}

# =============================================================================
# Auth Endpoints
# =============================================================================

@app.post("/api/auth/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel
class GoogleAuthRequest(BaseModel):
    email: str

@app.post("/api/auth/google", response_model=schemas.Token)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Create a new user with a random unguessable password for Google Auth users
        import secrets
        hashed_password = auth.get_password_hash(secrets.token_urlsafe(32))
        new_user = models.User(email=req.email, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# =============================================================================
# Plant Endpoints
# =============================================================================

@app.post("/api/plants", response_model=schemas.PlantResponse)
def create_plant(plant: schemas.PlantCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_plant = models.Plant(
        name=plant.name,
        species=plant.species,
        image_url=plant.image_url,
        user_id=current_user.id
    )
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant

@app.post("/api/plants/analyze-image", response_model=schemas.ImageAnalyzeResponse)
def analyze_plant_image(request: schemas.ImageAnalyzeRequest, current_user: models.User = Depends(auth.get_current_user)):
    """
    Takes a base64 image of a plant and returns structured data (name, species) to auto-fill the Add Plant form.
    """
    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a botanical expert. The user has uploaded an image of a plant. Extract the common name and the scientific species. Also provide a brief 1-word health status (Healthy, Thriving, Sick, etc.). If the image does not contain a plant, return 'Unknown' for name and species."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this plant and provide its details."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{request.image_base64}"}
                        }
                    ]
                }
            ],
            response_format=schemas.ImageAnalyzeResponse
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@app.get("/api/plants", response_model=List[schemas.PlantDetailResponse])
def read_plants(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Plant).filter(models.Plant.user_id == current_user.id).all()

@app.get("/api/plants/{plant_id}", response_model=schemas.PlantDetailResponse)
def read_plant(plant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Retrieve a specific Plant by its ID, including nested care_logs.
    """
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id, models.Plant.user_id == current_user.id).first()
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@app.delete("/api/plants/{plant_id}")
def delete_plant(plant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Delete a plant and its care logs.
    """
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id, models.Plant.user_id == current_user.id).first()
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    db.delete(plant)
    db.commit()
    return {"status": "success", "message": f"Plant {plant_id} deleted"}
    
@app.post("/api/care-logs", response_model=schemas.CareLogResponse)
def create_care_log(log: schemas.CareLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Directly create a care log for a specific plant.
    Useful for 'Mark as Done' interactions in the UI.
    """
    # Verify the plant belongs to the user
    plant = db.query(models.Plant).filter(models.Plant.id == log.plant_id, models.Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    db_log = models.CareLog(
        plant_id=log.plant_id,
        action_type=log.action_type,
        substance_used=log.substance_used,
        action_date=log.action_date or func.now()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# =============================================================================
# Multi-Agent Orchestrator
# =============================================================================

@app.post("/api/chat/orchestrator")
def orchestrate_chat(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Central router that intercepts user input, classifies intent, and delegates 
    to the appropriate specialized sub-agent (Logger, Diagnostician, or Botanist).
    """
    # -------------------------------------------------------------------------
    # Step A: Initialize the Graph State
    # -------------------------------------------------------------------------
    messages = []
    # Reconstruct history as LangChain messages
    for msg in request.history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg.get("content", "")))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg.get("content", "")))
            
    # Append the current user message
    messages.append(HumanMessage(content=request.user_message))
    
    # Fetch user's plants for context
    user_plants = db.query(models.Plant).filter(models.Plant.user_id == current_user.id).all()
    plants_context = [{"id": p.id, "name": p.name, "species": p.species, "health": p.health_status} for p in user_plants]

    # Optional context (can be passed via state or injected into prompt inside graph)
    # The prompt requested just these fields for initial_state:
    initial_state = {
        "messages": messages,
        "current_date": request.current_date,
        "image_base64": request.image_base64,
        "plants_context": plants_context,
        "db": db
    }

    # -------------------------------------------------------------------------
    # Step B: Invoke the Graph
    # -------------------------------------------------------------------------
    try:
        result_state = tarudrishti_app.invoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph Execution failed: {str(e)}")

    intent = result_state.get("intent")
    final_response = result_state.get("final_response", {})

    # -------------------------------------------------------------------------
    # Step C: Database Hook & Response Processing
    # -------------------------------------------------------------------------
    if intent == schemas.IntentType.LOG_CARE:
        if "error" in final_response:
            raise HTTPException(status_code=500, detail=final_response["error"])
            
        extraction_data = final_response.get("extraction", {})
        actions = extraction_data.get("actions", [])
        created_logs = []
        
        try:
            for action in actions:
                target_plants = []
                # Fallbacks for missing keys
                plant_name_or_species = action.get("plant_name_or_species", "")
                action_type = action.get("action_type", "")
                substance_used = action.get("substance_used")
                action_date = action.get("action_date")
                
                if plant_name_or_species == 'ALL_PLANTS':
                    target_plants = db.query(models.Plant).filter(models.Plant.user_id == current_user.id).all()
                else:
                    search_term = f"%{plant_name_or_species}%"
                    plant = db.query(models.Plant).filter(
                        models.Plant.user_id == current_user.id,
                        or_(
                            models.Plant.name.ilike(search_term),
                            models.Plant.species.ilike(search_term)
                        )
                    ).first()
                    if plant:
                        target_plants.append(plant)
                    else:
                        raise HTTPException(
                            status_code=404, 
                            detail=f"Plant '{plant_name_or_species}' not found in database. Please add it first."
                        )
                
                for plant in target_plants:
                    db_log = models.CareLog(
                        plant_id=plant.id,
                        action_type=action_type,
                        substance_used=substance_used,
                        action_date=action_date
                    )
                    db.add(db_log)
                    created_logs.append(db_log)
                    
            db.commit()

            # Summarize for the UI
            is_bulk = len(actions) > 1 or any(a.get("plant_name_or_species") == 'ALL_PLANTS' for a in actions)
            first_action = actions[0] if actions else {}
            
            summary_data = {
                "plant_name": "All Plants" if any(a.get("plant_name_or_species") == 'ALL_PLANTS' for a in actions) else first_action.get("plant_name_or_species"),
                "action_type": "Multiple Actions" if len(actions) > 1 else first_action.get("action_type"),
                "substance_used": ", ".join(filter(None, [a.get("substance_used") for a in actions])) or None,
                "action_date": first_action.get("action_date")
            }

            return {
                "intent": intent.value if hasattr(intent, "value") else str(intent),
                "message": f"Successfully logged care for {len(created_logs)} plant(s).",
                "data": summary_data
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database operation failed: {str(e)}")

    # For other intents, just return the generated message from final_response
    if "error" in final_response:
        raise HTTPException(status_code=500, detail=final_response["error"])
        
    return {
        "intent": intent.value if hasattr(intent, "value") else str(intent),
        "message": final_response.get("message", "I'm sorry, I couldn't process that.")
    }
