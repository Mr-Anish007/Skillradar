import re
from typing import List, Dict

# A curated list of tech skills to look for specifically
# Using sets for O(1) lookups and uniqueness
KNOWN_SKILLS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php",
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi",
    "spring boot", "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins",
    "git", "github", "gitlab", "ci/cd",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn", "nltk",
    "data analysis", "data science", "data engineering", "big data", "hadoop", "spark", "kafka",
    "rest", "graphql", "grpc", "microservices", "agile", "scrum", "kanban",
    "html", "css", "tailwind", "sass", "less", "bootstrap",
    "figma", "ui/ux", "seo"
}

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts potential skills from a block of text (job description or resume).
    Uses dictionary lookup with regex word boundaries to avoid partial matches.
    """
    if not text:
        return []

    # Clean and normalize the text
    text_lower = text.lower()
    
    extracted_skills = set()
    for skill in KNOWN_SKILLS:
        # Special handling for skills with special characters
        # Using word boundaries to avoid matching 'go' in 'good'
        escaped_skill = re.escape(skill)
        
        # We handle word boundaries explicitly. Characters like '+' and '#' are non-word 
        # characters in regex \b definitions, so we need a slightly custom boundary
        if not skill[-1].isalnum():
            # If skill ends with non-alnum (like c++, c#), standard \b might fail
            pattern = r'(?<!\w)' + escaped_skill + r'(?!\w)'
        else:
            pattern = r'\b' + escaped_skill + r'\b'
            
        if re.search(pattern, text_lower):
            extracted_skills.add(skill)

    return list(extracted_skills)

def calculate_skill_frequency(job_descriptions: List[str]) -> Dict[str, int]:
    """
    Simulates the batch processing of job descriptions to find trending skills.
    """
    skill_counts = {}
    for jd in job_descriptions:
        skills = extract_skills_from_text(jd)
        for skill in skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
    # Sort by frequency descending
    return dict(sorted(skill_counts.items(), key=lambda item: item[1], reverse=True))

if __name__ == "__main__":
    # Test the service
    sample_jd = "We are looking for a Software Engineer with experience in Python, Django, C++, and React. AWS and Docker are a plus. You should be familiar with CI/CD pipelines and Agile methodology."
    skills = extract_skills_from_text(sample_jd)
    print(f"Extracted skills: {skills}")
