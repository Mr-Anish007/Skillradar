from typing import List, Dict, Any
import json

# Note: In a real production app, we would use the OpenAI API here.
# For this prototype without an API key, we will simulate the LLM's responses
# based on intent recognition, proving the architectural integration works.

def generate_coach_response(user_message: str, user_context: Dict[str, Any]) -> str:
    """
    Generates a response from the AI Career Coach based on the user's message 
    and their current context (skills, league, targets).
    """
    msg_lower = user_message.lower()
    total_xp = user_context.get("total_xp", 0)
    league = user_context.get("league", "Bronze")
    target_role = user_context.get("target_role", "Software Engineer")
    
    response = ""
    
    # Intent: Ask about what to learn next
    if "learn" in msg_lower or "next" in msg_lower or "path" in msg_lower:
        response = f"Based on the market trends for {target_role}, I highly recommend tackling Docker or AWS next. You are currently in the {league} League, and mastering those will easily bump up your XP!"
        
    # Intent: Ask about resume
    elif "resume" in msg_lower or "cv" in msg_lower:
        response = "Your resume looks strong on the fundamentals like Python and SQL. To make it stand out to ATS systems, we should add some cloud deployment experience. Want me to generate a tailored resume for you right now?"
        
    # Intent: Ask for an interview/test
    elif "test" in msg_lower or "interview" in msg_lower or "assess" in msg_lower:
        response = "Alright, let's do a quick micro-assessment for React! Question 1: What is the primary difference between a controlled and uncontrolled component? (Answer correctly for 1000 XP!)"
        
    # Intent: Ask about points/gamification
    elif "points" in msg_lower or "xp" in msg_lower or "league" in msg_lower:
        response = f"You currently have {total_xp} XP and are in the {league} League! Keep validating your skills and tracking job trends to reach the Diamond League."

    # General conversation fallback
    else:
        response = f"I'm your AI Career Coach! I'm tracking the market for {target_role} roles. I can help you find your skill gaps, practice for interviews, or check your rank. What would you like to focus on today?"
        
    return response

def handle_chat_session(user_message: str, history: List[Dict[str, str]], user_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handles a full chat interaction, appending to history.
    """
    bot_reply = generate_coach_response(user_message, user_context)
    
    # We don't necessarily need to store history in DB for this V1, just pass it back and forth
    new_history = history.copy()
    new_history.append({"role": "user", "content": user_message})
    new_history.append({"role": "assistant", "content": bot_reply})
    
    return {
        "reply": bot_reply,
        "history": new_history
    }
