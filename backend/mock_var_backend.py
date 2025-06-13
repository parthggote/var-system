from fastapi import HTTPException
import random
from datetime import datetime

class MockVARBackend:
    def __init__(self):
        self.incident_types = [
            "foul",
            "offside",
            "handball",
            "goal",
            "corner",
            "throw-in"
        ]
        
    def analyze_frame(self, frame_data):
        """Mock analysis of a video frame"""
        try:
            # Simulate AI analysis
            incident_type = random.choice(self.incident_types)
            confidence = random.uniform(0.7, 0.95)
            
            return {
                "incident_type": incident_type,
                "confidence": confidence,
                "timestamp": frame_data.get("timestamp", datetime.now().timestamp())
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_decision_explanation(self, incident_data):
        """Generate a mock explanation for the decision"""
        try:
            incident_type = incident_data.get("incident_type", "unknown")
            confidence = incident_data.get("confidence", 0.0)
            
            explanations = {
                "foul": "Player made contact with opponent's legs from behind",
                "offside": "Attacking player was ahead of the last defender when the ball was played",
                "handball": "Player's arm was in an unnatural position when the ball made contact",
                "goal": "Ball completely crossed the goal line between the posts",
                "corner": "Defending player was the last to touch the ball before it went out",
                "throw-in": "Ball went out of play over the touchline"
            }
            
            base_explanation = explanations.get(incident_type, "No specific explanation available")
            return f"{base_explanation}. Confidence level: {confidence:.2f}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def save_results(self, results):
        """Mock saving results to database"""
        try:
            # Simulate database save
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 