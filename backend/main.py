import os
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from openai import OpenAI

from database import engine, Base, get_db
import models
import schemas

from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI app
app = FastAPI(title="Tarudrishti API")

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

# =============================================================================
# Plant Endpoints
# =============================================================================

@app.post("/api/plants", response_model=schemas.PlantResponse)
def create_plant(plant: schemas.PlantCreate, db: Session = Depends(get_db)):
    db_plant = models.Plant(name=plant.name, species=plant.species)
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant

@app.get("/api/plants", response_model=List[schemas.PlantResponse])
def read_plants(db: Session = Depends(get_db)):
    return db.query(models.Plant).all()

@app.get("/api/plants/{plant_id}", response_model=schemas.PlantDetailResponse)
def read_plant(plant_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific Plant by its ID, including nested care_logs.
    """
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@app.delete("/api/plants/{plant_id}")
def delete_plant(plant_id: int, db: Session = Depends(get_db)):
    """
    Delete a plant and its care logs.
    """
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    db.delete(plant)
    db.commit()
    return {"status": "success", "message": f"Plant {plant_id} deleted"}

# =============================================================================
# Multi-Agent Orchestrator
# =============================================================================

@app.post("/api/chat/orchestrator")
def orchestrate_chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    Central router that intercepts user input, classifies intent, and delegates 
    to the appropriate specialized sub-agent (Logger, Diagnostician, or Botanist).
    """
    # -------------------------------------------------------------------------
    # Step A: The Router Agent (Intent Classification)
    # -------------------------------------------------------------------------
    try:
        router_sys_msg = "You are the central routing agent for Tarudrishti. Classify the user's input strictly into the provided intent categories."
        if request.image_base64:
            router_sys_msg += " The user has attached an image to their request. If they are asking about health, symptoms, or identification, strongly prefer DIAGNOSE_PLANT."
            
        router_messages = [
            {
                "role": "system",
                "content": router_sys_msg
            }
        ]
        router_messages.extend(request.history)
        router_messages.append({
            "role": "user",
            "content": request.user_message
        })

        router_completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=router_messages,
            response_format=schemas.IntentClassification,
        )
        classification = router_completion.choices[0].message.parsed
        intent = classification.intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Router Agent failed: {str(e)}")

    # -------------------------------------------------------------------------
    # Step B: The Delegation Logic (Switch Statement)
    # -------------------------------------------------------------------------
    
    if intent == schemas.IntentType.LOG_CARE:
        # => The Logger Agent
        try:
            logger_messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a highly intelligent botanical assistant. Your job is to extract "
                        "plant care logging information from the user's natural language input. "
                        f"Assume the current date is {request.current_date}. Extract the plant name, "
                        "action type, any substance used, and the precise action date. Use conversation history to resolve pronouns."
                    )
                }
            ]
            logger_messages.extend(request.history)
            logger_messages.append({
                "role": "user",
                "content": request.user_message
            })

            logger_completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=logger_messages,
                response_format=schemas.CareLogExtraction,
            )
            extraction = logger_completion.choices[0].message.parsed
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Logger Agent extraction failed: {str(e)}")

        try:
            search_term = f"%{extraction.plant_name_or_species}%"
            plant = db.query(models.Plant).filter(
                or_(
                    models.Plant.name.ilike(search_term),
                    models.Plant.species.ilike(search_term)
                )
            ).first()

            if not plant:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Plant '{extraction.plant_name_or_species}' not found in database. Please add it first."
                )

            db_log = models.CareLog(
                plant_id=plant.id,
                action_type=extraction.action_type,
                substance_used=extraction.substance_used,
                action_date=extraction.action_date
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)

            return {
                "intent": intent.value,
                "message": "Care log successfully created via AI.",
                "data": schemas.CareLogResponse.model_validate(db_log)
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database operation failed: {str(e)}")

    elif intent == schemas.IntentType.DIAGNOSE_PLANT:
        # => The Diagnostician Agent (Vision-powered)

        # Validate that the user has actually provided an image
        if not request.image_base64:
            return {
                "intent": intent.value,
                "status": "awaiting_image",
                "message": "I've detected a diagnosis request. Please upload a photo of the affected plant so I can provide an accurate assessment."
            }

        try:
            sys_msg = (
                "You are an expert botanical diagnostician. Analyze the provided image "
                "of the plant. Identify the species if possible, diagnose any visible "
                "issues (pests, nutrient deficiencies, watering issues), and provide a "
                "concise, actionable treatment plan. Format your response in clean, "
                "readable markdown."
            )
            if request.weather_context:
                sys_msg += f"\n\nTake the user's local weather into account for your diagnosis and advice: {request.weather_context}"

            diag_messages = [
                {
                    "role": "system",
                    "content": sys_msg
                }
            ]
            # Strip out images from history to save tokens and prevent formatting errors, keep only text
            clean_history = []
            for msg in request.history:
                if isinstance(msg.get("content"), str):
                    clean_history.append(msg)
            
            diag_messages.extend(clean_history)
            diag_messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": request.user_message
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{request.image_base64}"
                        }
                    }
                ]
            })

            vision_completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=diag_messages,
                max_tokens=1024
            )
            return {
                "intent": intent.value,
                "message": vision_completion.choices[0].message.content
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Diagnostician Agent failed: {str(e)}")

    elif intent == schemas.IntentType.ADD_PLANT:
        # => The Onboarding Agent (Add Plant)
        try:
            add_messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful botanical assistant. Your job is to extract the name and species "
                        "of a new plant the user wants to add to their garden. Use the conversation history "
                        "and any provided image context to figure out the best name and species if not explicitly stated."
                    )
                }
            ]
            
            clean_history = []
            for msg in request.history:
                if isinstance(msg.get("content"), str):
                    clean_history.append(msg)
                    
            add_messages.extend(clean_history)
            
            if request.image_base64:
                add_messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": request.user_message},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{request.image_base64}"}}
                    ]
                })
            else:
                add_messages.append({"role": "user", "content": request.user_message})

            add_completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=add_messages,
                response_format=schemas.PlantExtraction,
            )
            extraction = add_completion.choices[0].message.parsed
            
            # Create plant in DB
            img_url = None
            if request.image_base64:
                img_url = f"data:image/jpeg;base64,{request.image_base64}"
            else:
                # Search history for the most recent image
                for msg in reversed(request.history):
                    content = msg.get("content")
                    if isinstance(content, list):
                        for item in content:
                            if item.get("type") == "image_url":
                                img_url = item.get("image_url", {}).get("url")
                                break
                    if img_url:
                        break
                        
            new_plant = models.Plant(
                name=extraction.name,
                species=extraction.species,
                health_status="Healthy",
                image_url=img_url
            )
            db.add(new_plant)
            db.commit()
            db.refresh(new_plant)
            
            return {
                "intent": intent.value,
                "message": f"Successfully added {new_plant.name} ({new_plant.species}) to your garden!",
                "data": schemas.PlantResponse.model_validate(new_plant)
            }
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Add Plant Agent failed: {str(e)}")

    elif intent == schemas.IntentType.DELETE_PLANT:
        # => The Deletion Agent
        try:
            del_messages = [
                {
                    "role": "system",
                    "content": "Extract the name of the plant the user wants to delete."
                }
            ]
            del_messages.extend([m for m in request.history if isinstance(m.get("content"), str)])
            del_messages.append({"role": "user", "content": request.user_message})

            del_completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=del_messages,
                response_format=schemas.DeletePlantExtraction,
            )
            extraction = del_completion.choices[0].message.parsed
            
            search_term = f"%{extraction.plant_name_or_species}%"
            plant = db.query(models.Plant).filter(
                or_(
                    models.Plant.name.ilike(search_term),
                    models.Plant.species.ilike(search_term)
                )
            ).first()

            if not plant:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Plant '{extraction.plant_name_or_species}' not found in your garden."
                )

            plant_name = plant.name
            db.delete(plant)
            db.commit()

            return {
                "intent": intent.value,
                "message": f"Successfully removed {plant_name} from your garden.",
                "action": "RELOAD_GALLERY"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Delete Plant Agent failed: {str(e)}")

    elif intent == schemas.IntentType.GENERAL_CHAT:
        # => The General Botanist Agent
        try:
            sys_msg = "You are an expert botanist answering a general gardening question. Keep your answer brief, warm, and highly accurate."
            if request.weather_context:
                sys_msg += f" Take the user's local weather into account for your advice: {request.weather_context}"

            chat_messages = [
                {
                    "role": "system",
                    "content": sys_msg
                }
            ]
            chat_messages.extend(request.history)
            chat_messages.append({
                "role": "user",
                "content": request.user_message
            })

            chat_completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=chat_messages
            )
            return {
                "intent": intent.value,
                "message": chat_completion.choices[0].message.content
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"General Chat Agent failed: {str(e)}")
