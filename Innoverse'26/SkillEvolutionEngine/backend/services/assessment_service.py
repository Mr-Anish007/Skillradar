import random
from typing import List, Dict, Any

def generate_mock_questions(skill: str) -> List[Dict[str, Any]]:
    """Generates exactly 10 questions (4 easy, 3 medium, 3 hard) for any given skill."""
    skill_name = skill.capitalize()
    return [
        # --- 4 Easy Questions ---
        {
            "id": 1,
            "question": f"(Easy) What is the primary purpose of {skill_name} in software development?",
            "options": ["To build and maintain applications", "To assemble hardware", "To manage office supplies", "To write emails"],
            "correct": 0
        },
        {
            "id": 2,
            "question": f"(Easy) Which of these is a fundamental concept associated with {skill_name}?",
            "options": ["Syntax and logic", "Photosynthesis", "Thermodynamics", "Aerodynamics"],
            "correct": 0
        },
        {
            "id": 3,
            "question": f"(Easy) Where is {skill_name} typically utilized?",
            "options": ["In agriculture", "In software engineering & IT", "In culinary arts", "In structural engineering"],
            "correct": 1
        },
        {
            "id": 4,
            "question": f"(Easy) Is proficiency in {skill_name} considered valuable in the tech industry today?",
            "options": ["Yes, it is highly demanded", "No, it is obsolete", "Only for historical research", "It has never been used"],
            "correct": 0
        },
        
        # --- 3 Medium Questions ---
        {
            "id": 5,
            "question": f"(Medium) How do you typically optimize performance when working extensively with {skill_name}?",
            "options": ["By ignoring memory constraints", "By utilizing efficient algorithms and best practices", "By writing more lines of code", "By deleting random files"],
            "correct": 1
        },
        {
            "id": 6,
            "question": f"(Medium) Which common architectural pattern is frequently integrated with {skill_name} solutions?",
            "options": ["Model-View-Controller (MVC) or variations", "The Pyramids", "Randomized execution", "Linear uncoupled execution"],
            "correct": 0
        },
        {
            "id": 7,
            "question": f"(Medium) What is a standard testing methodology for {skill_name} projects?",
            "options": ["Deploying immediately to production", "Unit testing and integration testing", "Guessing if it works", "Only visual inspection"],
            "correct": 1
        },
        
        # --- 3 Hard Questions ---
        {
            "id": 8,
            "question": f"(Hard) Explain a low-level mechanism often discussed by seniors using {skill_name}.",
            "options": ["Magic variables", "Garbage collection and memory/resource referencing", "Manual hardware switch toggling", "It doesn't use resources"],
            "correct": 1
        },
        {
            "id": 9,
            "question": f"(Hard) How can {skill_name} be architected to handle asynchronous data streams under heavy load?",
            "options": ["Using event loops, thread pools, or scalable queues", "By running an infinite while loop", "By slowing down the system constraints", "It automatically crashes"],
            "correct": 0
        },
        {
            "id": 10,
            "question": f"(Hard) When scaling a highly complex {skill_name} application, what is a primary concern for the Big O complexity?",
            "options": ["O(1) is always guaranteed", "Keeping core data transformations to O(n log n) or better", "O(n!) is preferred for thoroughness", "Complexity does not matter at scale"],
            "correct": 1
        }
    ]

def get_questions_for_skill(skill: str, count: int = 10) -> List[Dict[str, Any]]:
    """Retrieves 10 dynamic questions for the requested skill."""
    return generate_mock_questions(skill)

def validate_answers(skill: str, submissions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates submitted answers and calculates score.
    submissions format: [{"question_id": 1, "selected_option": 0}, ...]
    """
    all_questions = generate_mock_questions(skill)
    id_map = {q["id"]: q for q in all_questions}
    
    correct_count = 0
    total = len(submissions)
    
    for sub in submissions:
        q_id = sub.get("question_id")
        selected = sub.get("selected_option")
        
        if q_id in id_map and id_map[q_id]["correct"] == selected:
            correct_count += 1
            
    score_percentage = (correct_count / len(all_questions) * 100) if all_questions else 0
    
    return {
        "score": round(score_percentage, 1),
        "correct_count": correct_count,
        "total": len(all_questions),
        "passed": score_percentage >= 70
    }
