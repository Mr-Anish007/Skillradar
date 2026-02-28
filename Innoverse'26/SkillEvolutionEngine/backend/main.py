from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

# Internal Imports
from models.database import SessionLocal, engine, User, UserSkill, UserAssignment, AssessmentResult
from services.nlp_service import extract_skills_from_text, KNOWN_SKILLS
from services.resume_service import parse_resume, build_resume
from services.recommendation_service import calculate_skill_gap, generate_learning_pathway
from services.job_matching_service import match_user_to_jobs
from services.gamification_service import process_assessment_result, get_anonymous_leaderboard
from services.ai_coach_service import handle_chat_session
from services.forecasting_service import forecast_skill_demand
from services.assignment_service import generate_assignment_for_user, get_user_assignments
from services.assessment_service import get_questions_for_skill, validate_answers
import json

app = FastAPI(
    title="SkillRadar API",
    description="API for personalized learning pathways, gamification, and skill prediction.",
    version="1.0.0",
)

# CORS setup for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Authentication Configuration ---
import passlib.handlers.bcrypt
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import uuid

SECRET_KEY = "dummy_secret_key_for_demo_purposes_only"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

# --- Pydantic Schemas ---
class ChatMessage(BaseModel):
    message: str
    user_context: Dict[str, Any]
    history: List[Dict[str, str]] = []

class AssessmentPayload(BaseModel):
    user_id: int
    skill_name: str
    score: float

class PathwayRequest(BaseModel):
    user_skills: List[str]
    target_role: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserSkillsUpdate(BaseModel):
    skills: List[str]
    name: str = None

class AssignmentComplete(BaseModel):
    assignment_id: int
    status: str = "completed"

class AssessmentSubmission(BaseModel):
    skill: str
    answers: List[Dict[str, Any]] # [{"question_id": 1, "selected_option": 0}, ...]

# --- API Routes ---

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_username = db.query(User).filter(User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Auto-login upon registration
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id, "username": db_user.username}

@app.post("/api/auth/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id, "username": db_user.username}

@app.post("/api/auth/guest")
def login_guest(db: Session = Depends(get_db)):
    guest_id = str(uuid.uuid4())[:8]
    username = f"Guest_{guest_id}"
    email = f"guest_{guest_id}@example.com"
    hashed_password = get_password_hash(guest_id)
    
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id, "username": db_user.username}

@app.get("/api/user/me")
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skills = [us.skill_name for us in current_user.skills]
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "skills": skills
    }

@app.post("/api/user/skills")
def update_user_skills(payload: UserSkillsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name:
        current_user.username = payload.name
        
    # Clear existing skills
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()
    
    # Add new skills
    for skill in payload.skills:
        new_skill = UserSkill(user_id=current_user.id, skill_name=skill.lower(), proficiency_level=1)
        db.add(new_skill)
        
    db.commit()
    return {"message": "Skills updated successfully", "skills": payload.skills}

@app.get("/api/dashboard/summary")
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Consolidated endpoint for dashboard data, including personalized recommendations."""
    user_skills = [us.skill_name for us in current_user.skills]
    
    # Default target role for MVP
    target_role = "Software Engineer"
    market_wants = {
        "python": 90, "aws": 85, "docker": 80, "react": 75, 
        "machine learning": 70, "sql": 65, "html": 60
    }
    
    # Calculate Gaps & Pathway
    gaps = calculate_skill_gap(set(user_skills), market_wants)
    pathway = generate_learning_pathway(gaps)
    
    # Generate Trend Data for the Top 3 skills in the target role
    import random
    from datetime import datetime, timedelta
    
    trends = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month_idx = datetime.now().month - 1
    
    # Build last 6 months list
    display_months = [months[(current_month_idx - 5 + i) % 12] for i in range(6)]
    
    top_skills = ["python", "react", "docker"] # Default for demo
    
    for i in range(6):
        data_point = {"name": display_months[i]}
        for skill in top_skills:
            # Simulated interest score with a slight upward trend
            data_point[skill] = int(40 + (i * 5) + random.randint(-5, 5))
        trends.append(data_point)
        
    # Get latest assessment results
    from sqlalchemy import desc
    latest_assessments = db.query(AssessmentResult).filter(AssessmentResult.user_id == current_user.id).order_by(desc(AssessmentResult.completed_at)).limit(5).all()
    
    # Generate Mock Industry News
    mock_news = [
        {"title": "The Rise of Agentic AI Software Engineering", "source": "TechCrunch", "url": "https://techcrunch.com"},
        {"title": "OpenAI drops latest reasoning models", "source": "Wired", "url": "https://wired.com"},
        {"title": "Top 5 Frameworks to Learn in 2026", "source": "HackerNews", "url": "https://news.ycombinator.com"},
        {"title": "Companies shift towards skill-based hiring over degrees", "source": "Forbes", "url": "https://forbes.com"}
    ]
    
    return {
        "user": {
            "username": current_user.username,
            "total_xp": current_user.total_xp,
            "league": current_user.league,
            "skills": [
                {"skill_name": s.skill_name, "proficiency": s.proficiency_level, "validated": s.is_validated}
                for s in current_user.skills
            ]
        },
        "trends": trends,
        "recommendations": pathway,
        "news": mock_news,
        "latest_results": [
            {"skill": a.skill_name, "score": a.score, "passed": a.passed, "date": a.completed_at.isoformat()}
            for a in latest_assessments
        ]
    }

@app.get("/api/user/assignments")
def api_get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch all assignments recorded for the current user."""
    assignments = get_user_assignments(db, current_user.id)
    return assignments

@app.post("/api/user/assignments/generate")
def api_generate_assignment(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a new assignment based on the user's analyzed skills."""
    user_skills = [us.skill_name for us in current_user.skills]
    if not user_skills:
        raise HTTPException(status_code=400, detail="Please complete onboarding and add skills before requesting an assignment.")
    
    assignment = generate_assignment_for_user(db, current_user.id, user_skills)
    return assignment

@app.post("/api/user/assignments/complete")
def api_complete_assignment(payload: AssignmentComplete, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark an assignment as completed and award XP."""
    assignment = db.query(UserAssignment).filter(
        UserAssignment.id == payload.assignment_id,
        UserAssignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status == "completed":
        return {"message": "Assignment already completed", "xp_earned": 0}
        
    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()
    
    # Award XP
    current_user.total_xp += assignment.xp_reward
    db.commit()
    
    return {"message": "Assignment marked as completed!", "xp_earned": assignment.xp_reward, "new_total_xp": current_user.total_xp}

@app.get("/api/user/assessments/questions")
def api_get_assessment_questions(skill: str, current_user: User = Depends(get_current_user)):
    """Fetch MCQ questions for a specific skill."""
    questions = get_questions_for_skill(skill)
    return {"skill": skill, "questions": questions}

@app.post("/api/user/assessments/submit")
def api_submit_assessment(payload: AssessmentSubmission, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Validate MCQ answers, record result, and award XP."""
    result = validate_answers(payload.skill, payload.answers)
    
    # Save result to DB
    from models.database import AssessmentResult
    from datetime import datetime
    
    xp_earned = 1000 if result["passed"] else 0
    
    new_result = AssessmentResult(
        user_id=current_user.id,
        skill_name=payload.skill,
        score=result["score"],
        passed=1 if result["passed"] else 0,
        xp_earned=xp_earned,
        answers_json=json.dumps(payload.answers),
        completed_at=datetime.utcnow()
    )
    
    db.add(new_result)
    
    if result["passed"]:
        current_user.total_xp += xp_earned
        
        # Check if the user already has this skill, if so boost proficiency, else add it
        from models.database import UserSkill
        existing_skill = db.query(UserSkill).filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_name.ilike(payload.skill)
        ).first()
        
        if existing_skill:
            existing_skill.is_validated = 1
            existing_skill.proficiency_level = min(100, existing_skill.proficiency_level + 10)
        else:
            new_skill = UserSkill(
                user_id=current_user.id,
                skill_name=payload.skill,
                proficiency_level=70,
                is_validated=1
            )
            db.add(new_skill)
            
    db.commit()
    
    return {
        "passed": result["passed"],
        "score": result["score"],
        "xp_earned": xp_earned,
        "new_total_xp": current_user.total_xp
    }

@app.get("/api/user/assessments/history")
def api_get_assessment_history(skill: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch history of assessments for the current user."""
    query = db.query(AssessmentResult).filter(AssessmentResult.user_id == current_user.id)
    if skill:
        query = query.filter(AssessmentResult.skill_name.ilike(skill))
    
    from sqlalchemy import desc
    results = query.order_by(desc(AssessmentResult.completed_at)).all()
    
    return [
        {
            "id": r.id,
            "skill": r.skill_name,
            "score": r.score,
            "passed": r.passed,
            "xp_earned": r.xp_earned,
            "date": r.completed_at.isoformat(),
            "answers": json.loads(r.answers_json) if r.answers_json else []
        }
        for r in results
    ]

@app.post("/api/resume/parse")
async def api_parse_resume(file: UploadFile = File(...)):
    """Upload a PDF/DOCX resume, returns extracted skills."""
    contents = await file.read()
    result = parse_resume(contents, file.filename)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/pathways/recommend")
def api_recommend_pathway(req: PathwayRequest):
    """Calculates skill gaps and generates a learning pathway."""
    # Simulated mapping of Target Role to demanded skills (in reality, queried from DB)
    market_wants = {"python": 90, "aws": 85, "docker": 80, "react": 75, "machine learning": 70}
    
    gaps = calculate_skill_gap(set(req.user_skills), market_wants)
    pathway = generate_learning_pathway(gaps)
    
    return {
        "target_role": req.target_role,
        "gaps": gaps,
        "pathway": pathway
    }

@app.post("/api/jobs/match")
def api_match_jobs(user_skills: List[str]):
    """Matches the user's skills against simulated live job postings."""
    mock_job_market = [
        {"id": 101, "title": "Backend Engineer", "company": "CloudSync", "required_skills": ["python", "django", "postgresql", "redis"]},
        {"id": 102, "title": "Cloud Architect", "company": "SkyNet", "required_skills": ["aws", "docker", "kubernetes", "python"]},
    ]
    matches = match_user_to_jobs(user_skills, mock_job_market)
    return {"matches": matches}

@app.post("/api/gamification/assessment")
def api_submit_assessment(payload: AssessmentPayload, db: Session = Depends(get_db)):
    """Submit a micro-assessment score to earn XP and update League."""
    # Create dummy user if none exists (for MVP testing purposes)
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = User(id=payload.user_id, username=f"testuser_{payload.user_id}", email=f"test{payload.user_id}@test.com")
        db.add(user)
        db.commit()
        
    result = process_assessment_result(db, payload.user_id, payload.skill_name, payload.score)
    return result

@app.get("/api/gamification/leaderboard")
def api_get_leaderboard(db: Session = Depends(get_db)):
    """Get the anonymous leaderboard."""
    board = get_anonymous_leaderboard(db, limit=10)
    return {"leaderboard": board}

@app.post("/api/coach/chat")
def api_coach_chat(chat: ChatMessage):
    """Chat with the built-in AI Career Coach."""
    response = handle_chat_session(chat.message, chat.history, chat.user_context)
    return response

@app.get("/api/forecasting/trend/{skill}")
def api_skill_trend(skill: str):
    """Get the 12-month demand forecast for a specific skill."""
    if skill.lower() not in KNOWN_SKILLS:
         # Generic upward trend for demo purposes
         pass
    
    import random
    from datetime import datetime, timedelta
    
    base_date = datetime.now() - timedelta(days=30*24)
    dates_str = [(base_date + timedelta(days=30*i)).strftime("%Y-%m-%d") for i in range(24)]
    frequencies = [int(50 + (i * 2) + random.randint(-5, 5)) for i in range(24)]
    
    forecast = forecast_skill_demand(dates_str, frequencies, skill.lower())
    return forecast

import os
import sys
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Determine if running in PyInstaller bundle or live
if getattr(sys, 'frozen', False):
    frontend_dir = os.path.join(sys._MEIPASS, "frontend_out")
else:
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend_out")

if os.path.isdir(frontend_dir):
    # Mount the assets directory (Vite)
    assets_dir = os.path.join(frontend_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not os.path.isdir(frontend_dir):
        return {"error": "Frontend build not found. Please run npm run build."}
        
    path = os.path.join(frontend_dir, full_path)
    # Don't allow directory traversal
    if ".." in full_path:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    if os.path.isfile(path):
        response = FileResponse(path)
        # Never cache index.html
        if "index.html" in path:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response
    html_path = path + ".html"
    if os.path.isfile(html_path):
        return FileResponse(html_path)
        
    # If the request is for an asset that doesn't exist, return 404, not index.html
    if full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Asset not found")
        
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.isfile(index_path):
        response = FileResponse(index_path)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response
    raise HTTPException(status_code=404, detail="Not found")

if __name__ == "__main__":
    import uvicorn
    import threading
    import time
    import webview
    
    def start_api():
        # Run the FastAPI app without reloading to avoid multiprocessing issues in the bundled app
        uvicorn.run(app, host="127.0.0.1", port=8000)
    
    # Start the FastAPI server in a background thread
    t = threading.Thread(target=start_api)
    t.daemon = True
    t.start()
    
    # Give the server a moment to start before opening the window
    time.sleep(1)
    
    # Launch pywebview window on the main thread
    window = webview.create_window(
        "SkillRadar",
        "http://127.0.0.1:8000",
        width=1200,
        height=800,
        resizable=True
    )
    webview.start(private_mode=False)
