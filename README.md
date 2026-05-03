# 🌱 Tarudrishti — AI-Powered Autonomous Plant Care System

🔗 Live Demo: https://tarudrishti.vercel.app/

Tarudrishti is an intelligent plant care platform that combines **computer vision, multi-agent AI, and real-world context (weather + history)** to help users identify plants, diagnose issues, and automate plant care.

It goes beyond a simple chatbot by using a **multi-agent orchestration system** to interpret user intent, take actions, and manage plant care autonomously.

---

## 📸 Preview


-Home Page <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/2af81afc-f272-40ce-8d3c-76d82b9480dd" />

- Dashboard View <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/a1a0460f-e17c-4eef-8945-88a4b1c67853" />

My Garden view- <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/8dbeca89-eb3a-4468-90d7-640b5f296951" />

- Plant Gallery  <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/dea53fc3-60e9-42c1-9a78-49a9dbe1ca69" />

- AI Diagnosis Output  <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/4bca9fc1-dafc-44d3-8d9c-3eb94cef1248" />

- Voice Interaction  <img width="2930" height="1596" alt="image" src="https://github.com/user-attachments/assets/a3fbab69-7ba7-4129-bbf9-5b7694da4ecf" />


---

## 🚀 Features

- 📷 **Plant Identification** — Detect plant species using image input  
- 🩺 **Disease Diagnosis** — Analyze plant health using image + weather context  
- 🗣️ **Natural Language Logging** — Log care actions via text or voice  
- 📅 **Smart Scheduling** — Automatically calculate watering & fertilization cycles  
- 📩 **Automated Notifications** — Daily email reminders for due tasks  
- 🌦️ **Weather-Aware Advice** — Uses real-time environmental context  
- 🎙️ **Voice Interaction** — Web Speech API for real-time input  

---

## 🧠 Multi-Agent AI Architecture

Tarudrishti uses a **modular multi-agent system** instead of a single LLM prompt.

### 🔹 Router Agent
- Classifies user intent  
- Routes request to appropriate agent  
- Uses structured outputs for deterministic behavior  

### 🔹 Logger Agent (`LOG_CARE`)
- Extracts structured actions from natural language  
- Supports bulk operations (e.g., “water all plants”)  
- Writes directly to database  

### 🔹 Diagnostician Agent (`DIAGNOSE_PLANT`)
- Analyzes plant images + weather context  
- Identifies diseases, pests, deficiencies  
- Returns actionable treatment advice  

### 🔹 Onboarding Agent (`ADD_PLANT`)
- Identifies plant species from image  
- Extracts name + metadata  
- Adds plant to system  

### 🔹 Deletion Agent (`DELETE_PLANT`)
- Identifies plant to remove via natural language  
- Safely deletes from database  

### 🔹 Botanist Agent (`GENERAL_CHAT`)
- Handles general plant-related queries  
- Provides contextual advice  

---

## 🏗️ System Architecture
<img width="2464" height="2330" alt="image" src="https://github.com/user-attachments/assets/4878478c-c6d7-429a-bb74-aa79b05532e0" />

### 🔍 Key Design Decisions

- Used a router-based architecture instead of a single LLM prompt  
- Enforced structured outputs using Pydantic schemas  
- Separated intent classification from execution for reliability  
- Integrated contextual signals (weather + history) into AI reasoning  

---

## ⚙️ Tech Stack

### Frontend
- React 18 + Vite  
- Tailwind CSS  
- Framer Motion  
- Web Speech API  

### Backend
- FastAPI  
- SQLAlchemy (Postgres / SQLite)  
- OpenAI API (GPT-4o, structured outputs)  
- APScheduler  

---

## 🔍 Key Engineering Highlights

- ✅ **Structured LLM Outputs** using Pydantic schemas  
- ✅ **Intent Classification + Routing Layer**  
- ✅ **Multimodal AI (Text + Image)**  
- ✅ **Context Injection (Weather + History)**  
- ✅ **Background Job Scheduling (Email Automation)**  
- ✅ **Transaction-safe DB operations with rollback**  

---

## 📊 Example Workflows

### 1. Natural Language Logging
Input: "I watered all my plants and used neem oil yesterday"
→ Router → Logger Agent
→ Extract structured actions
→ Store in database

---

### 2. Disease Diagnosis
Input: Image + "What’s wrong with this plant?"
→ Router → Diagnostician Agent
→ Analyze image + weather
→ Return diagnosis + treatment

---

### 3. Automated Scheduling
System checks care history daily
→ Identifies overdue tasks
→ Sends email notifications

---

## ⚠️ Limitations

- Image-based diagnosis depends on image quality  
- Requires OpenAI API (cost considerations)  
- Scheduling logic is rule-based (can be enhanced with AI)  
- Not yet optimized for large-scale multi-user environments  

---

## 🔮 Future Improvements

- AI-driven dynamic scheduling (instead of fixed intervals)  
- Mobile application  
- Multi-user support  
- IoT integration (soil sensors, smart irrigation)  
- LLM cost optimization + caching  
- Retry/fallback mechanisms for robustness  

---

## 🛠️ Setup Instructions

### Backend
cd backend
python -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
pip install -r requirements.txt

Create `.env`:
OPENAI_API_KEY=your_key

SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
NOTIFICATION_EMAIL=your_email

Run:
uvicorn main:app --reload

---

### Frontend
npm install

Create `.env`:
VITE_API_URL=http://localhost:8000

Run:
npm run dev

---

## 📌 Key Takeaway

Tarudrishti demonstrates how **LLMs can be orchestrated as specialized agents to build autonomous, real-world systems**, rather than simple chat interfaces.

---

## 👨‍💻 Author

Built by Samaditya Jatar  
