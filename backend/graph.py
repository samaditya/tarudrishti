import os
from typing import TypedDict, Optional, List, Dict, Any
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.graph import StateGraph, END
from openai import OpenAI

import schemas
import models
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    messages: List[AnyMessage]
    current_date: str
    image_base64: Optional[str]
    intent: Optional[schemas.IntentType]
    final_response: Optional[Dict[str, Any]]
    plants_context: List[Dict[str, Any]]
    db: Any

# Initialize OpenAI model and client
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
openai_client = OpenAI()

def router_node(state: AgentState):
    structured_llm = llm.with_structured_output(schemas.IntentClassification)
    
    sys_msg = SystemMessage(content=(
        "You are the central routing agent for Tarudrishti. Classify the user's input strictly "
        "into the provided intent categories. If an image is provided, first verify it clearly contains a plant. "
        "If it is a random object, set intent to GENERAL_CHAT and tell the user to upload a clear plant photo. "
        "Otherwise, classify intent normally. "
        f"User's current plants: {state['plants_context']}"
    ))
    
    try:
        response = structured_llm.invoke([sys_msg] + state["messages"])
        return {"intent": response.intent}
    except Exception as e:
        # Fallback to general chat if parsing fails
        return {"intent": schemas.IntentType.GENERAL_CHAT}

def logger_node(state: AgentState):
    structured_llm = llm.with_structured_output(schemas.CareLogExtraction)
    
    sys_msg = SystemMessage(content=(
        "You are a highly intelligent botanical assistant. Your job is to extract plant care logging "
        f"information from the user's natural language input. Assume the current date is {state['current_date']}. "
        "Extract the plant name, action type, any substance used, and the precise action date. "
        "Use conversation history to resolve pronouns. "
        f"User's current plants: {state['plants_context']}. "
        "If the user refers to a plant they own, use the exact name from the list provided."
    ))
    
    try:
        extraction = structured_llm.invoke([sys_msg] + state["messages"])
        return {"final_response": {"extraction": extraction.model_dump()}}
    except Exception as e:
        return {"final_response": {"error": f"Logger Agent failed: {str(e)}"}}

def diagnostician_node(state: AgentState):
    sys_msg = SystemMessage(content=(
        "You are an expert botanical diagnostician. The user is describing a plant issue or asking for a diagnosis. "
        "If they provided an image, analyze it closely. If they only provided text, do your best to diagnose based on their description. "
        "Provide a concise, practical, and highly specific action plan for treating the issue. "
        "Keep it brief and mobile-friendly (max 2-3 short paragraphs). Use bullet points for steps. "
        "Format your response in clean, readable markdown. "
        f"User's current plants: {state['plants_context']}"
    ))
    
    msgs = [sys_msg]
    # Filter out old images to save context
    for msg in state["messages"][:-1]:
        if isinstance(msg, HumanMessage) and isinstance(msg.content, str):
            msgs.append(msg)
        elif isinstance(msg, AIMessage):
            msgs.append(msg)
            
    # Re-append last human message, conditionally adding image
    last_msg = state["messages"][-1]
    if state.get("image_base64"):
        content = [
            {"type": "text", "text": last_msg.content if isinstance(last_msg.content, str) else "Analyze this image."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{state['image_base64']}"}}
        ]
        msgs.append(HumanMessage(content=content))
    else:
        msgs.append(last_msg)
        
    try:
        response = llm.invoke(msgs)
        return {"final_response": {"message": response.content}}
    except Exception as e:
        return {"final_response": {"error": f"Diagnostician Agent failed: {str(e)}"}}

def botanist_node(state: AgentState):
    db = state.get("db")
    last_msg = state["messages"][-1].content
    if isinstance(last_msg, list):
        # Extract text if it's a multimodal message
        query_text = " ".join([p["text"] for p in last_msg if p.get("type") == "text"])
    else:
        query_text = last_msg

    try:
        # Generate embedding
        response = openai_client.embeddings.create(
            input=query_text,
            model="text-embedding-3-small"
        )
        query_embedding = response.data[0].embedding
        
        # Check semantic cache if db is available
        if db:
            cached_result = db.query(models.SemanticCache).filter(
                models.SemanticCache.embedding.cosine_distance(query_embedding) < 0.15
            ).first()
            
            if cached_result:
                return {"final_response": {"message": cached_result.response_text}}
                
        # If no cache hit, generate response
        sys_msg = SystemMessage(content=(
            "You are an expert botanist answering a general gardening question. Be concise, direct, and "
            "practical. Avoid fluff. Give quick step-by-step instructions. Use bullet points. "
            "Keep responses under 150 words. "
            f"User's current plants: {state['plants_context']}"
        ))
        
        llm_response = llm.invoke([sys_msg] + state["messages"])
        response_text = llm_response.content
        
        # Save to cache
        if db:
            new_cache = models.SemanticCache(
                query_text=query_text,
                response_text=response_text,
                embedding=query_embedding
            )
            db.add(new_cache)
            db.commit()
            
        return {"final_response": {"message": response_text}}
    except Exception as e:
        if db:
            db.rollback()
        return {"final_response": {"error": f"General Chat Agent failed: {str(e)}"}}

def error_node(state: AgentState):
    """Strict fallback for hallucinated router states."""
    return {"final_response": {"message": "I'm having trouble understanding. Could you rephrase your plant question?"}}

def route_intent(state: AgentState):
    intent = state.get("intent")
    if intent == schemas.IntentType.LOG_CARE:
        return "logger"
    elif intent == schemas.IntentType.DIAGNOSE_PLANT:
        return "diagnostician"
    elif intent == schemas.IntentType.GENERAL_CHAT:
        return "botanist"
    # Fallback
    return "error"

# Build the graph
builder = StateGraph(AgentState)

builder.add_node("router_node", router_node)
builder.add_node("logger_node", logger_node)
builder.add_node("diagnostician_node", diagnostician_node)
builder.add_node("botanist_node", botanist_node)
builder.add_node("error_node", error_node)

builder.set_entry_point("router_node")

builder.add_conditional_edges(
    "router_node",
    route_intent,
    {
        "logger": "logger_node",
        "diagnostician": "diagnostician_node",
        "botanist": "botanist_node",
        "error": "error_node"
    }
)

builder.add_edge("logger_node", END)
builder.add_edge("diagnostician_node", END)
builder.add_edge("botanist_node", END)
builder.add_edge("error_node", END)

tarudrishti_app = builder.compile()
