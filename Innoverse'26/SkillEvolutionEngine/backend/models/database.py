from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Using SQLite for robust local development instead of setting up a remote Postgres immediately.
# Can be seamlessly migrated to Postgres later by changing the URL.
SQLALCHEMY_DATABASE_URL = "sqlite:///./skill_evolution.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Gamification Fields
    total_xp = Column(Integer, default=0)
    league = Column(String, default="Bronze") # Bronze, Silver, Gold, Platinum
    
    # Relationships
    skills = relationship("UserSkill", back_populates="user")
    assessments = relationship("AssessmentResult", back_populates="user")
    assignments = relationship("UserAssignment", back_populates="user")

class UserAssignment(Base):
    """Tracks specific tasks or assignments given to users to practice their skills"""
    __tablename__ = "user_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="pending") # pending, completed, reviewed
    xp_reward = Column(Integer, default=500)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="assignments")

class UserSkill(Base):
    """Maps a user to a specific skill they possess, with validation status"""
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String, index=True)
    proficiency_level = Column(Integer, default=1) # 1-100
    is_validated = Column(Integer, default=0) # 0 = self-reported, 1 = passed validation test
    
    user = relationship("User", back_populates="skills")

class AssessmentResult(Base):
    """Tracks the micro-assessments users take to validate skills and earn massive XP"""
    __tablename__ = "assessment_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String, index=True)
    score = Column(Float) # Percentage score
    passed = Column(Integer, default=0) # 0 or 1
    xp_earned = Column(Integer, default=0)
    answers_json = Column(String, nullable=True) # Stores user answers as a JSON string
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="assessments")

# Create tables
Base.metadata.create_all(bind=engine)

# Auto-migrate legacy SQLite databases
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        result = conn.execute(text("PRAGMA table_info(assessment_results)")).fetchall()
        columns = [row[1] for row in result]
        if "answers_json" not in columns and len(columns) > 0:
            conn.execute(text("ALTER TABLE assessment_results ADD COLUMN answers_json TEXT"))
            conn.commit()
            print("Auto-migrated assessment_results table to include answers_json.")
except Exception as e:
    print(f"Warning during DB auto-migration: {e}")
