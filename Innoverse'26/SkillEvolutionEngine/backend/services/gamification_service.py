from sqlalchemy.orm import Session
from models.database import User, UserSkill, AssessmentResult
import math

# Constants
XP_PER_COURSE = 500
XP_PER_ASSESSMENT_PASS = 1000
XP_PER_ARTICLE_READ = 50

LEAGUE_THRESHOLDS = {
    "Bronze": 0,
    "Silver": 2000,
    "Gold": 5000,
    "Platinum": 10000,
    "Diamond": 25000
}

def calculate_league(total_xp: int) -> str:
    """Determine a user's league based on their total XP."""
    current_league = "Bronze"
    for league, threshold in LEAGUE_THRESHOLDS.items():
        if total_xp >= threshold:
            current_league = league
    return current_league

def process_assessment_result(db: Session, user_id: int, skill_name: str, score: float) -> dict:
    """
    Processes a completed skill assessment.
    If the user scores > 70%, they pass, the skill is validated, and they earn massive XP.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
        
    passed = int(score >= 70.0)
    xp_earned = XP_PER_ASSESSMENT_PASS if passed else 100 # Consolation XP for trying
    
    # Record the assessment
    assessment = AssessmentResult(
        user_id=user_id,
        skill_name=skill_name.lower(),
        score=score,
        passed=passed,
        xp_earned=xp_earned
    )
    db.add(assessment)
    
    # Update total XP and League
    user.total_xp += xp_earned
    user.league = calculate_league(user.total_xp)
    
    # If passed, validate the skill
    if passed:
        skill_record = db.query(UserSkill).filter(
            UserSkill.user_id == user_id, 
            UserSkill.skill_name == skill_name.lower()
        ).first()
        
        if skill_record:
            skill_record.is_validated = 1
            skill_record.proficiency_level = max(skill_record.proficiency_level, int(score))
        else:
            # If they took an assessment for a skill they didn't list, add it automatically
            new_skill = UserSkill(
                user_id=user_id,
                skill_name=skill_name.lower(),
                proficiency_level=int(score),
                is_validated=1
            )
            db.add(new_skill)
            
    db.commit()
    
    return {
        "success": True,
        "passed": bool(passed),
        "xp_earned": xp_earned,
        "new_total_xp": user.total_xp,
        "current_league": user.league
    }

def get_anonymous_leaderboard(db: Session, limit: int = 10):
    """
    Returns an anonymized leaderboard for healthy competition.
    Returns: [{"rank": 1, "alias": "Future Engineer #102", "league": "Gold", "xp": 8500}, ...]
    """
    # Order users by total XP descending
    top_users = db.query(User).order_by(User.total_xp.desc()).limit(limit).all()
    
    leaderboard = []
    for rank, user in enumerate(top_users, 1):
        # Create an anonymous alias using their ID to preserve privacy
        alias = f"Evolution Pioneer #{user.id + 1000}"
        
        leaderboard.append({
            "rank": rank,
            "alias": alias,
            "league": user.league,
            "xp": user.total_xp
        })
        
    return leaderboard
