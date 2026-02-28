from typing import List, Dict, Any

def match_user_to_jobs(user_skills: List[str], available_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks available job postings based on how well the user's validated skills match
    the job's required skills.
    
    available_jobs: A list of dicts, e.g., [{"id": 1, "title": "Data Eng", "required_skills": ["python", "sql", "spark"], "company": "TechCorp"}]
    """
    ranked_jobs = []
    user_skill_set = set([s.lower() for s in user_skills])
    
    for job in available_jobs:
        job_skills = set([s.lower() for s in job.get("required_skills", [])])
        
        if not job_skills:
            continue
            
        # Calculate overlap
        matching_skills = user_skill_set.intersection(job_skills)
        missing_skills = job_skills.difference(user_skill_set)
        
        match_percentage = (len(matching_skills) / len(job_skills)) * 100
        
        ranked_jobs.append({
            "job_id": job.get("id"),
            "title": job.get("title"),
            "company": job.get("company"),
            "match_percentage": round(match_percentage, 1),
            "matching_skills": list(matching_skills),
            "missing_skills": list(missing_skills),
            "highly_recommended": match_percentage >= 80.0
        })
        
    # Sort by match percentage highest to lowest
    ranked_jobs.sort(key=lambda x: x["match_percentage"], reverse=True)
    return ranked_jobs

if __name__ == "__main__":
    # Test job matching
    user_skills = ["python", "docker", "aws", "postgresql"]
    
    mock_job_market = [
        {
            "id": 101, 
            "title": "Backend Engineer", 
            "company": "CloudSync", 
            "required_skills": ["python", "django", "postgresql", "redis"]
        },
        {
            "id": 102, 
            "title": "Cloud Architect", 
            "company": "SkyNet", 
            "required_skills": ["aws", "docker", "kubernetes", "terraform", "python"]
        },
        {
            "id": 103, 
            "title": "Data Scientist", 
            "company": "DataCorp", 
            "required_skills": ["python", "pandas", "machine learning", "tensorflow"]
        }
    ]
    
    matches = match_user_to_jobs(user_skills, mock_job_market)
    print("Top Job Matches:")
    for m in matches:
        print(f" - {m['title']} at {m['company']}: {m['match_percentage']}% Match. Missing: {m['missing_skills']}")
