from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

class Technique(BaseModel):
    id: str
    name: str
    tactic: str
    description: str

class Transition(BaseModel):
    from_id: str
    to_id: str
    probability: float
    context: Optional[str] = None

class NextStagePrediction(BaseModel):
    technique_id: str
    technique_name: str
    probability: float

class SimulationState(BaseModel):
    incident_id: str
    current_technique: Technique
    detected_at: datetime
    history: List[str] # List of technique IDs
    next_possible_stages: List[NextStagePrediction]
    llm_reasoning: Optional[str] = None
    recommended_action: Optional[str] = None
    is_prevented: bool = False
    
    # Advanced Metrics
    risk_score: int = 0  # 0-100
    risk_trend: str = "stable" # increasing, stable, decreasing
    projected_financial_impact: float = 0.0 # Dynamic calculation
    time_to_impact_estimate: str = "Unknown"


class IncidentStartRequest(BaseModel):
    sector: str = "Finance"
    initial_alert_type: str = "Phishing"

class EvolutionRequest(BaseModel):
    incident_id: str
    override_next_stage: Optional[str] = None # For forcing a path if needed
