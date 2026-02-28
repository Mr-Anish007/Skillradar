# Skill Evolution Engine - How to Run

## Project Overview
This project contains a robust MVP for an Industry-Aligned Skill Evolution Prediction Engine.
It uses FastAPI and Python for the scalable AI/Data backend, and Next.js + React for a modern, accessible web dashboard.

## Services Implemented
### Backend (Python/FastAPI)
- **NLP Service**: Extracts technical skills from raw job descriptions & resumes.
- **Resume Service**: Parses PDFs/DOCX files and mathematically generates skill-gap focused resumes.
- **Forecasting Service**: Uses linear regression time-series algorithms to predict a skill's future demand score.
- **Job Matching**: Takes user's confirmed skills and logically maps them against job templates to rank match %.
- **Gamification Service**: Calculates XP, manages skill assessments, and calculates anonymous League Leaderboards.
- **AI Coach**: Interactive simulated agent routing career advice based on user stats.

### Frontend (Next.js/React)
- **Modern Landing Page**: High-converting, animated Next.js page with `lucide-react` icons.
- **Accessible Dashboard**: Features Recharts for tracking skill trends, interactive sidebars, and an XP UI component. Adheres to dark-mode and semantic contrast.

---

## How to Run the Application Locally

### 1. Start the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd SkillEvolutionEngine/backend
   ```
2. Activate the virtual environment:
   ```bash
   # On Windows
   venv\Scripts\activate
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
4. *The backend API will run on http://localhost:8000. You can view all automatic API docs at http://localhost:8000/docs*

### 2. Start the Frontend
1. Open a second terminal and navigate to the frontend folder:
   ```bash
   cd SkillEvolutionEngine/frontend
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. *Open your browser to http://localhost:3000 to see the landing page and navigate to the Dashboard.*
