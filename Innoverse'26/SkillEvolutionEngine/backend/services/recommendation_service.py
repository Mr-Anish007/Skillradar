from typing import List, Dict, Any

def calculate_skill_gap(user_skills: set, target_role_demand: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Compares the user's current skills against the forecasted market demand for a specific role.
    Target role demand is expected to be a dict of: {"skill_name": importance_score_0_to_100}
    """
    missing_skills = []
    
    for skill, demand_score in target_role_demand.items():
        if skill.lower() not in [s.lower() for s in user_skills]:
            missing_skills.append({
                "skill": skill,
                "importance": demand_score,
                "status": "missing"
            })
            
    # Sort missing skills by importance (highest first)
    missing_skills.sort(key=lambda x: x["importance"], reverse=True)
    return missing_skills

def generate_learning_pathway(missing_skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates a recommended sequence of learning modules based on missing skills.
    In a real app, this would query a course database.
    """
    pathway = []
    
    # Predefined course mapping for simulation
    COURSE_DB = {
        "python": {"name": "Python for Data Science Masterclass", "xp": 500, "duration": "4 weeks", "platform": "Coursera", "category": "Paid", "url": "https://www.coursera.org/specializations/python"},
        "react": {"name": "Advanced React Patterns", "xp": 600, "duration": "3 weeks", "platform": "Udemy", "category": "Paid", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"},
        "docker": {"name": "Docker and Kubernetes: The Complete Guide", "xp": 800, "duration": "5 weeks", "platform": "Coursera", "category": "Paid", "url": "https://www.coursera.org/learn/docker-at-scale"},
        "aws": {"name": "AWS Certified Solutions Architect", "xp": 1000, "duration": "8 weeks", "platform": "CloudGuru", "category": "Paid", "url": "https://www.pluralsight.com/cloud-guru/courses/aws-certified-solutions-architect-associate-saa-c03"},
        "machine learning": {"name": "Machine Learning by Andrew Ng", "xp": 1200, "duration": "10 weeks", "platform": "Coursera", "category": "Free", "url": "https://www.coursera.org/specializations/machine-learning-introduction"},
        "html": {"name": "HTML5 & CSS3 Full Course", "xp": 200, "duration": "1 week", "platform": "YouTube/FreeCodeCamp", "category": "Free", "url": "https://www.youtube.com/watch?v=mJgBOIoGihA"},
        "sql": {"name": "Database Management System", "xp": 400, "duration": "4 weeks", "platform": "NPTEL", "category": "Free", "url": "https://nptel.ac.in/courses/106105175"}
    }
    
    for item in missing_skills:
        skill = item["skill"].lower()
        if skill in COURSE_DB:
            course = COURSE_DB[skill].copy()
            course["target_skill"] = skill
            pathway.append(course)
        else:
            # Generic fallback for unknown skills
            pathway.append({
                "name": f"Comprehensive Guide to {skill.title()}",
                "xp": 300,
                "duration": "2 weeks",
                "target_skill": skill,
                "platform": "General Learning",
                "category": "Free",
                "url": f"https://www.google.com/search?q=free+courses+for+{skill}"
            })
            
    return pathway

if __name__ == "__main__":
    # Test gap analysis
    user_has = {"html", "css", "javascript"}
    market_wants = {"javascript": 90, "react": 85, "node.js": 80, "docker": 75}
    
    gaps = calculate_skill_gap(user_has, market_wants)
    print("Skill Gaps:", gaps)
    
    path = generate_learning_pathway(gaps)
    print("\nRecommended Pathway:")
    for step in path:
        print(f" - {step['name']} (Est: {step['duration']}, XP: {step['xp']})")
