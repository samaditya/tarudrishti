# 🌱 Tarudrishti - Autonomous Botanical Assistant

Tarudrishti is a state-of-the-art, autonomous botanical assistant and plant care tracking platform. Designed with a premium glassmorphic UI, it leverages a multi-agent AI architecture to recognize plants, diagnose diseases, log care activities autonomously via voice or text, and schedule notifications.

![Tarudrishti Preview](./docs/preview.png) *(Note: Please add a preview screenshot here)*

---

## ✨ Core Features

*   **Premium Glassmorphic UI**: Beautiful, fully responsive layout with dynamic Dark/Light modes, micro-animations via `framer-motion`, and fluid transitions.
*   **Intelligent Plant Gallery**: View all your plants in a visually stunning grid. Each card displays real-time health status, the exact substance last applied (e.g., NPK), and watering history.
*   **Dynamic Care Schedule**: The autonomous scheduling engine calculates realistic due dates for watering and fertilizing based on actual logged history, rather than arbitrary timers.
*   **Voice-Activated AI Chat**: Talk to the Botanical AI using native Web Speech API recognition. Transcribes voice-to-text in real-time.
*   **Image Analysis & Onboarding**: Snap a photo of a new plant, and the AI will automatically identify the species and onboard it into your garden.
*   **Automated Email Notifications**: A background scheduler runs daily to calculate which plants need attention and sends a formatted HTML email report directly to your inbox.
*   **Weather-Aware Context**: The AI automatically fetches your local weather conditions (temperature, weather codes) and uses this context when providing care advice or diagnosing issues.

---

## 🤖 The Multi-Agent Architecture

Tarudrishti is powered by a highly intelligent backend orchestrator built with FastAPI and OpenAI. Instead of a single LLM prompt, the system relies on **Six Specialized Agents**:

1.  **Router Agent**: The brain of the operation. It analyzes the user's input (text, images, and local weather context) and strictly routes the request to the most capable sub-agent.
2.  **Onboarding Agent (`ADD_PLANT`)**: Activated when you want to add a new plant. It performs visual analysis on uploaded images to determine the plant's species and initial health status before saving it to the database.
3.  **Logger Agent (`LOG_CARE`)**: A highly sophisticated entity that parses conversational updates (e.g., *"I just watered and sprayed Neem oil on all my plants"*). It supports **bulk actions** and extracts structured data to log multiple activities across multiple plants simultaneously.
4.  **Diagnostician Agent (`DIAGNOSE_PLANT`)**: The plant doctor. It analyzes visual symptoms from photos (or text descriptions) alongside local weather data to identify pests, diseases, or nutrient deficiencies, providing an actionable treatment plan.
5.  **Botanist Agent (`GENERAL_CHAT`)**: The horticultural expert. Handles all general gardening Q&A, offering rich markdown-formatted advice.
6.  **Mailer Agent (Background Worker)**: An autonomous `APScheduler` loop that wakes up every day at 8:00 AM. It scans the database, calculates the next due dates for watering and substance application, and dispatches automated email notifications.

---

## 🛠️ Technology Stack

**Frontend (Client)**
*   React 18 & Vite
*   Tailwind CSS (Vanilla Custom Configurations)
*   Framer Motion (Animations & Gestures)
*   Lucide React (Iconography)
*   Web Speech API (Voice Recognition)

**Backend (Server)**
*   FastAPI & Uvicorn
*   Python 3.10+
*   SQLAlchemy & SQLite/Postgres
*   OpenAI API (GPT-4o / GPT-4o-mini structured outputs)
*   APScheduler (Background Cron Jobs)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   An OpenAI API Key

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
OPENAI_API_KEY="your-openai-api-key"
# Optional: For Live Email Notifications
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
NOTIFICATION_EMAIL="your-email@gmail.com"
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd ..  # Back to root directory
npm install
```

Create a `.env` file in the root directory:
```env
VITE_API_URL="http://localhost:8000"
```

Start the Vite development server:
```bash
npm run dev
```

---

## 📸 Adding Screenshots

To complete your documentation, take screenshots of your application and place them in a `docs/` folder.
*   `docs/gallery.png` - The main plant gallery view.
*   `docs/schedule.png` - The dynamic care schedule view.
*   `docs/chat.png` - The Botanical AI chat interface showing a diagnosis or care log.

---
*Built autonomously with Antigravity AI.*
