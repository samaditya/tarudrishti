<p align="center">
  <img src="./public/pwa-192x192.png" alt="Tarudrishti Logo" width="80" />
</p>

<h1 align="center">🌱 Tarudrishti</h1>

<p align="center">
  <strong>An Agentic, Multi-Agent Botanical AI — Powered by LangGraph</strong>
</p>

<p align="center">
  A full-stack, production-grade PWA that uses a multi-agent AI orchestrator to manage your garden.<br/>
  Talk to it in natural language. Upload a photo. It identifies your plant, diagnoses diseases,<br/>
  logs care activities into a Postgres database, and emails you daily schedules — autonomously.
</p>

<p align="center">
  <a href="https://tarudrishti.vercel.app">🌐 Live Demo</a> ·
  <a href="#architecture">🏗️ Architecture</a> ·
  <a href="#engineering-highlights">⚙️ Engineering</a> ·
  <a href="#local-development">🛠️ Setup</a>
</p>

---

## 📸 Screenshots

<div align="center">
  <img src="./docs/dashboard.png" alt="Main Dashboard UI" width="800" />
  <p><em>Plant gallery with glassmorphic cards, health indicators, and weather-aware AI insights.</em></p>
</div>

<div align="center">
  <img src="./docs/ai_chat.png" alt="AI Chat Sheet" width="600" />
  <p><em>Multi-agent chat: diagnose diseases via vision, log care via natural language, get expert advice.</em></p>
</div>

---

## ✨ What It Does

| Capability | How It Works |
|---|---|
| **🧠 Natural Language Care Logging** | Say _"I watered all my plants yesterday with neem oil"_ — the Logger Agent extracts plant names, action types, substances, and dates, then writes structured rows to PostgreSQL. |
| **👁️ Vision-Based Plant Identification** | Upload a photo → GPT-4o-mini returns the common name, scientific species, and health assessment via structured output. Auto-fills the "Add Plant" form. |
| **🩺 Disease Diagnosis** | Upload a photo of a sick leaf → the Diagnostician Agent analyzes the image and returns a step-by-step treatment plan in markdown. |
| **⚡ Semantic Caching** | Repeated botanical questions are answered instantly from a `pgvector` cosine similarity cache, bypassing OpenAI entirely. |
| **📧 Autonomous Email Scheduler** | APScheduler runs a daily cron job at 8 AM, queries each user's care logs, computes overdue tasks, and emails a styled HTML report. |
| **🌦️ Weather-Aware AI Advice** | Fetches local weather via Open-Meteo and injects it into the LLM context so advice adapts to your climate. |
| **🎤 Voice Input** | Web Speech API allows fully hands-free interaction with the AI while you're in the garden. |

---

<a id="architecture"></a>
## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        REACT / VITE CLIENT                         │
│                        (Vercel — PWA)                              │
│                                                                    │
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ PlantGallery│  │ AIChatSheet  │  │ScheduleView│  │WeatherWidget│ │
│  └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  └──────┬─────┘  │
│        │                │                │                │        │
│        └───────┬────────┴────────┬───────┘                │        │
│                │  apiFetch()     │                         │        │
│                │  + JWT Bearer   │  Geolocation API        │        │
│                │  + Cold-Start   │  + Open-Meteo           │        │
│                │    Interceptor  │                         │        │
└────────────────┼────────────────┼─────────────────────────┼────────┘
                 │                │                         │
           HTTPS │          HTTPS │                    Public API
                 ▼                ▼                         │
┌──────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND (Render)                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               POST /api/chat/orchestrator                    │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐     │   │
│  │  │              LANGGRAPH STATE MACHINE                │     │   │
│  │  │                                                     │     │   │
│  │  │   ┌─────────┐    ┌──────────────┐                  │     │   │
│  │  │   │ Router  │───▶│ route_intent │                  │     │   │
│  │  │   │  Node   │    │  (conditional)│                  │     │   │
│  │  │   └─────────┘    └──────┬───────┘                  │     │   │
│  │  │                         │                          │     │   │
│  │  │          ┌──────────────┼──────────────┐           │     │   │
│  │  │          ▼              ▼              ▼           │     │   │
│  │  │   ┌──────────┐  ┌─────────────┐  ┌──────────┐    │     │   │
│  │  │   │  Logger  │  │Diagnostician│  │ Botanist │    │     │   │
│  │  │   │  Agent   │  │   Agent     │  │  Agent   │    │     │   │
│  │  │   └────┬─────┘  └─────────────┘  └────┬─────┘    │     │   │
│  │  │        │                               │          │     │   │
│  │  │        │ Structured                    │ pgvector │     │   │
│  │  │        │ Extraction                    │ Cache    │     │   │
│  │  │        ▼                               ▼          │     │   │
│  │  └────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐   │
│  │  APScheduler (Cron)  │   │  JWT Auth (get_current_user)     │   │
│  │  Daily 8AM Mailer    │   │  Row-Level Tenant Isolation      │   │
│  └──────────────────────┘   └──────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 POSTGRESQL + pgvector (Neon.tech)                    │
│                                                                     │
│   users ──1:N──▶ plants ──1:N──▶ care_logs                         │
│                                                                     │
│   semantic_cache (embedding Vector(1536), cosine distance < 0.15)  │
└──────────────────────────────────────────────────────────────────────┘
```

---

<a id="engineering-highlights"></a>
## ⚙️ Engineering Highlights

### 1. LangGraph Multi-Agent Orchestrator (`graph.py`)
Instead of a single monolithic LLM prompt, the system uses a **compiled LangGraph state machine** with four specialized nodes:
- **Router Node** — Uses OpenAI Structured Output to classify intent into `LOG_CARE`, `DIAGNOSE_PLANT`, or `GENERAL_CHAT` with a confidence score.
- **Logger Agent** — Extracts structured `CareLogExtraction` (plant name, action type, substance, date) from natural language using Pydantic-validated structured output.
- **Diagnostician Agent** — Processes multimodal input (text + base64 image) for plant disease diagnosis.
- **Botanist Agent** — Answers general questions, with a **semantic cache bypass** to avoid redundant LLM calls.
- **Error Node** — Deterministic fallback for any hallucinated or unrecognized router state.

### 2. pgvector Semantic Cache (`models.py` + `graph.py`)
Frequently asked botanical questions are cached using `text-embedding-3-small` (1536-dim vectors) stored in a `pgvector` column. On each query, cosine distance is computed in-database:
```python
db.query(SemanticCache).filter(
    SemanticCache.embedding.cosine_distance(query_embedding) < 0.15
).first()
```
If a match is found (85%+ semantic similarity), the cached response is returned instantly — **zero LLM latency, zero API cost**.

### 3. Client-Side Image Compression (`AIChatSheet.jsx`)
Before any image hits the network, it is **client-side compressed** using the HTML5 Canvas API:
```javascript
const canvas = document.createElement('canvas');
canvas.width = width;  // Max 1024px
canvas.height = height;
ctx.drawImage(img, 0, 0, width, height);
canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
```
This prevents API gateway timeouts on mobile networks by reducing a 5MB phone photo to ~100-200KB before base64 encoding.

### 4. JWT Multi-Tenant Data Isolation (`auth.py` + `main.py`)
Every database query is scoped to the authenticated user via a FastAPI dependency chain:
```
Request → JWT Decode → get_current_user(token) → user.id
                                                      ↓
db.query(Plant).filter(Plant.user_id == current_user.id)
```
There is **no endpoint** that queries data without the `current_user.id` filter. Tenant isolation is enforced at the dependency injection level, not by convention.

### 5. Optical Nested Border Radius (`PlantCard.jsx`)
To prevent content bleeding at rounded corners, the codebase enforces the mathematical rule:
```
Inner Radius = Outer Radius − Padding
```
```jsx
// Outer container: 20px radius, 1px border
<div className="rounded-[20px]" style={{ border: '1px solid ...' }}>
  // Inner image: 19px radius (20 - 1 = 19)
  <div className="rounded-[19px]">
```

### 6. Framer Motion Spring Physics (`animations.js`)
All layout animations use a centralized spring configuration tuned for premium feel:
```javascript
export const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
};
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Framer Motion, Tailwind CSS, React Query, React Markdown |
| **AI** | OpenAI GPT-4o-mini, text-embedding-3-small, LangGraph, LangChain |
| **Backend** | FastAPI, SQLAlchemy, Pydantic v2, APScheduler |
| **Database** | PostgreSQL + pgvector (Neon.tech) |
| **Auth** | JWT (python-jose), bcrypt, Google OAuth |
| **PWA** | vite-plugin-pwa, Workbox (NetworkFirst caching) |
| **Hosting** | Vercel (frontend), Render (backend) |

---

<a id="local-development"></a>
## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL with the `pgvector` extension

### 1. Clone & Install

```bash
git clone https://github.com/samaditya/tarudrishti.git
cd tarudrishti
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/tarudrishti
OPENAI_API_KEY=sk-proj-...
JWT_SECRET_KEY=your_64_char_hex_secret
```

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
# From the project root
npm install
```

Create `.env` in the project root:
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📦 Deployment

### Infrastructure as Code
The `render.yaml` in the project root defines the full backend deployment:
- Gunicorn with 4 Uvicorn workers
- Auto-generated `JWT_SECRET_KEY`
- Strict environment variable injection

### Environment Variables

**Vercel (Frontend):**
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

**Render (Backend):**
| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `JWT_SECRET_KEY` | Auto-generated or `openssl rand -hex 32` |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built with 🌿 for plants and clean code.</p>
</div>
