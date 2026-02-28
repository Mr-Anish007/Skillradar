from services.resume_service import build_resume, extract_skills_from_text

# Test the resume builder
if __name__ == "__main__":
    user_name = "Jane Doe"
    base_skills = ["java", "html", "css"]
    target_role = "Full-Stack Developer"
    market_trend_skills = ["react", "next.js", "node.js", "docker", "aws"]
    
    resume_md = build_resume(user_name, base_skills, target_role, market_trend_skills)
    print(resume_md)
    
    print("\n\nTesting nested import of NLP service...")
    text = "Jane knows Java and heavily uses Docker to deploy Node.js backends."
    found_skills = extract_skills_from_text(text)
    print(f"Skills found in text: {found_skills}")
