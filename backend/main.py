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
import uvicorn
from mock_var_backend import MockVARBackend

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
classifier = None
llm = None

# Initialize the mock VAR backend
var_backend = MockVARBackend()

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

@app.get("/")
async def root():
    return {"message": "VAR System API is running"}

@app.post("/models/analyze")
async def analyze_frame(frame_data: dict):
    try:
        result = var_backend.analyze_frame(frame_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/llm/explain")
async def get_decision_explanation(incident_data: dict):
    try:
        explanation = var_backend.get_decision_explanation(incident_data)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/db/save")
async def save_results(results: dict):
    try:
        success = var_backend.save_results(results)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Get port from environment variable or default to 8000
    port = int(os.getenv("PORT", 8000))
    # Run the application
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 