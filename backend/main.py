from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from transformers import pipeline
import torch
import json
import os
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
classifier = None
llm = None

class Keypoint(BaseModel):
    name: str
    x: float
    y: float
    score: float

class FrameData(BaseModel):
    keypoints: List[Keypoint]
    timestamp: int

class IncidentData(BaseModel):
    frame_data: List[FrameData]
    incident_type: str
    confidence: float

# Load models on startup
@app.on_event("startup")
async def startup_event():
    global classifier, llm
    try:
        # Initialize pose classification model
        classifier = pipeline(
            "image-classification",
            model="microsoft/resnet-50",
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Initialize LLM for explanations
        llm = pipeline(
            "text-generation",
            model="gpt2",
            device=0 if torch.cuda.is_available() else -1
        )
    except Exception as e:
        print(f"Error loading models: {e}")

@app.post("/models/analyze")
async def analyze_frame(frame_data: FrameData):
    try:
        # Convert keypoints to feature vector
        features = np.array([[kp.x, kp.y, kp.score] for kp in frame_data.keypoints])
        
        # Perform classification
        result = classifier(features)
        
        return {
            "incident_type": result[0]["label"],
            "confidence": result[0]["score"],
            "timestamp": frame_data.timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/llm/explain")
async def explain_decision(incident_data: IncidentData):
    try:
        # Generate explanation using LLM
        prompt = f"""
        Analyze the following football incident:
        Type: {incident_data.incident_type}
        Confidence: {incident_data.confidence}
        
        Provide a detailed explanation of why this decision was made:
        """
        
        explanation = llm(prompt, max_length=200, num_return_sequences=1)[0]["generated_text"]
        
        return {
            "explanation": explanation,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/db/save")
async def save_results(results: Dict[str, Any]):
    try:
        # Save results to file (replace with actual database in production)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results_{timestamp}.json"
        
        with open(filename, "w") as f:
            json.dump(results, f)
        
        return {"status": "success", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 