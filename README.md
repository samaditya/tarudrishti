# 🌱 Tarudrishti

<div align="center">
  <h3>Your Agentic Botanical AI & Plant Care Dashboard</h3>
  <p>A full-stack, AI-powered PWA that intelligently tracks your garden, diagnoses plant issues via images, and orchestrates complex natural language interactions using a multi-agent backend.</p>
</div>

---

## 📸 Screenshots

*(Replace these placeholder paths with your actual screenshots)*

<div align="center">
  <img src="./docs/dashboard.png" alt="Main Dashboard UI" width="800" />
  <p><em>Premium, Apple-tier glassmorphic UI built with Framer Motion.</em></p>
</div>

<div align="center">
  <img src="./docs/ai_chat.png" alt="AI Chat Sheet" width="600" />
</div>

---

## ✨ Features

- **🧠 Multi-Agent AI Orchestrator:** Built with **LangGraph**, the central router dynamically classifies user intents to specialized sub-agents:
  - **Botanist Agent:** Answers general plant care questions.
  - **Diagnostician Agent:** Analyzes multimodal input (text + images) to diagnose plant diseases and provide action plans.
  - **Logger Agent:** Extracts care events (watering, fertilizers) from natural language and safely logs them into your database.
- **👁️ Automated Image Analysis:** Upload a photo of a plant, and the AI automatically extracts its common name, scientific species, and health status to bypass manual entry.
- **⚡ Cost-Saving Semantic Caching:** Utilizes `pgvector` and OpenAI embeddings to cache and instantly retrieve answers to previously asked questions, drastically reducing redundant LLM API costs.
- **📱 Progressive Web App (PWA):** Features full offline support via service workers. If you lose connection in your garden, the app degrades gracefully with smooth UI fallbacks.
- **💅 "Apple-Tier" Motion Design:** Implements high-end optical math, nested border radii, and 60fps Framer Motion spring physics for an incredibly premium user experience.
- **🔐 Multi-Tenant Security:** Robust JWT-based authentication with strict row-level schema isolation. 

---

## 🛠️ Technology Stack

### **Frontend Client**
- **React 18** via **Vite**
- **Framer Motion** (Spring physics & layout animations)
- **Tailwind CSS** (Utility-first styling & dark mode)
- **React Query** (Server state & data fetching)
- **Vite PWA Plugin** (Workbox caching for offline functionality)
- **Lucide React** (Consistent iconography)

### **Backend Engine**
- **FastAPI** (High-performance Python web framework)
- **LangGraph & LangChain** (Agentic AI workflows)
- **OpenAI API** (`gpt-4o-mini` & `text-embedding-3-small`)
- **SQLAlchemy** (ORM)
- **PostgreSQL + pgvector** (Vector database hosted on Neon.tech)
- **APScheduler** (Background cron jobs for daily care reminders)

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/samaditya/tarudrishti.git
cd tarudrishti
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://user:password@localhost/tarudrishti
OPENAI_API_KEY=sk-...
JWT_SECRET_KEY=your_super_secret_key
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal and navigate back to the root directory:
```bash
npm install
```

Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_auth_id
```

Run the Vite dev server:
```bash
npm run dev
```

---

## 🚀 Deployment Architecture

Tarudrishti is engineered for zero-downtime serverless deployments.

- **Frontend:** Hosted on **Vercel** (`https://tarudrishti.vercel.app`).
- **Backend:** Hosted on **Render** using a custom `render.yaml` Blueprint for strict memory pooling and Gunicorn worker allocation.
- **Database:** Serverless PostgreSQL hosted on **Neon.tech** with explicit connection pooling limits to prevent burst exhaustion.

### Launch Configuration (`render.yaml`)
The project utilizes Infrastructure-as-Code for the backend. Committing to `main` will automatically trigger a Render build based on the provided YAML configurations.

---

<div align="center">
  <p>Built with ❤️ for plants and clean code.</p>
</div>
