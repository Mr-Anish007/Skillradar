import io
import pymupdf  # fits
from docx import Document
from typing import List, Dict, Any
from .nlp_service import extract_skills_from_text

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a uploaded PDF file."""
    text = ""
    try:
        # Open the PDF from bytes
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text() + "\n"
    except Exception as e:
        print(f"Error parsing PDF: {e}")
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from an uploaded DOCX file."""
    text = ""
    try:
        doc = Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
    return text

def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses a resume file (PDF or DOCX) and extracts the user's skills.
    In a full application, this would also use an LLM to extract Experience and Education.
    """
    text = ""
    # 1. Extract raw text based on file type
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith('.docx'):
        text = extract_text_from_docx(file_bytes)
    else:
        return {"error": "Unsupported file format. Please upload PDF or DOCX."}
        
    if not text.strip():
        return {"error": "Could not extract text from the file."}

    # 2. Extract skills using our NLP service
    found_skills = extract_skills_from_text(text)
    
    # 3. Basic structural parsing (simulated)
    # We could send the `text` to an LLM like OpenAI to pull out specific job histories here.
    
    return {
        "filename": filename,
        "extracted_skills": found_skills,
        "raw_text_length": len(text)
    }

def build_resume(user_name: str, base_skills: List[str], target_role: str, market_trend_skills: List[str]) -> str:
    """
    Generates a markdown formatted resume tailored to a target role, 
    highlighting the market-ready skills the user has acquired.
    """
    # Combine user's base skills with the new market-ready skills they've learned
    all_skills = list(set(base_skills + market_trend_skills))
    
    resume_md = f"""# {user_name}
## Targeted Role: {target_role}

---

### Professional Summary
A future-ready {target_role} with verified competencies in both core and highly trending industry skills. Proactively upskilled through data-driven learning pathways.

### Core & Trending Skills
* **Technical Skills**: {', '.join(all_skills).title()}

### Education & Certifications
* **SkillRadar Validated Competencies**
  * Top Performer in Market-Ready Tech Assessments (Gold League)
  * Completed specialized pathways for {target_role}

### Professional Experience
* [Experience section to be dynamically filled by user's past data]
"""
    return resume_md
