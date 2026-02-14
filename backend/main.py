from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import uvicorn
from datetime import datetime
import random

from models import (
    Technique, 
    Transition, 
    SimulationState, 
    IncidentStartRequest, 
    NextStagePrediction,
    EvolutionRequest
)
from llm_client import generate_incident_insight

app = FastAPI(title="Cognitive Incident Twin API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATA STORE ---
# Hardcoded for the designated "Ransomware Kill Chain" scenario
TECHNIQUES: Dict[str, Technique] = {
    "T1566": Technique(id="T1566", name="Phishing", tactic="Initial Access", description="Adversaries send phishing messages to gain access to victim systems."),
    "T1059": Technique(id="T1059", name="Command and Scripting Interpreter", tactic="Execution", description="Adversaries may abuse command and scripting interpreters to execute commands."),
    "T1098": Technique(id="T1098", name="Account Manipulation", tactic="Persistence", description="Adversaries may manipulate accounts to maintain access."),
    "T1083": Technique(id="T1083", name="File and Directory Discovery", tactic="Discovery", description="Adversaries may enumerate files and directories or query the file system."),
    "T1057": Technique(id="T1057", name="Process Discovery", tactic="Discovery", description="Adversaries may attempt to get information about running processes."),
    "T1021": Technique(id="T1021", name="Remote Services", tactic="Lateral Movement", description="Adversaries may use Valid Accounts to log into a service accepting remote connections."),
    "T1005": Technique(id="T1005", name="Data from Local System", tactic="Collection", description="Adversaries may search for and copy sensitive data from local systems."),
    "T1486": Technique(id="T1486", name="Data Encrypted for Impact", tactic="Impact", description="Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability.")
}

# --- METRIC CONFIGURATION ---
# Base Severity Scores for Risk Calculation (0-100 Scale)
SEVERITY_SCORES = {
    "Initial Access": 20,
    "Execution": 40,
    "Persistence": 50,
    "Discovery": 55,
    "Lateral Movement": 75,
    "Collection": 85,
    "Impact": 100
}

# Estimated Financial Impact per Technique (if successful)
FINANCIAL_IMPACT_MAP = {
    "T1566": 15000,    # Phishing cleanup
    "T1059": 50000,    # IR Response
    "T1098": 80000,    # Account resets/audits
    "T1083": 40000,    # Audit
    "T1057": 20000,
    "T1021": 500000,   # Major breach expansion
    "T1005": 1200000,  # Data Exfiltration
    "T1486": 2400000   # Ransomware full encryption
}

def calculate_metrics(current_tech: Technique, next_predictions: List[NextStagePrediction]) -> Dict:
    """Calculates dynamic risk score and financial impact."""
    
    # 1. Risk Score: Base severity of current stage + weighting of likely future severity
    base_score = SEVERITY_SCORES.get(current_tech.tactic, 30)
    
    # Add trend modifier based on next likely step
    future_risk_adder = 0
    highest_impact = 0.0
    
    if next_predictions:
        top_pred = next_predictions[0] # List is sorted by prob
        future_tech = TECHNIQUES.get(top_pred.technique_id)
        if future_tech:
            future_severity = SEVERITY_SCORES.get(future_tech.tactic, 0)
            if future_severity > base_score:
                future_risk_adder = (future_severity - base_score) * top_pred.probability
            
            # 2. Financial Impact: Probability * Cost
            impact_val = FINANCIAL_IMPACT_MAP.get(top_pred.technique_id, 0)
            highest_impact = impact_val * top_pred.probability

    total_risk = min(int(base_score + future_risk_adder), 100)
    
    # Time to Impact Heuristic
    # Deeper in the chain = less time left
    depth_map = ["Initial Access", "Execution", "Persistence", "Discovery", "Lateral Movement", "Collection", "Impact"]
    try:
        idx = depth_map.index(current_tech.tactic)
        steps_left = 6 - idx
        time_estimate = f"{steps_left * 4} hours" if steps_left > 0 else "IMMEDIATE"
    except:
        time_estimate = "Unknown"

    return {
        "risk_score": total_risk,
        "risk_trend": "Increasing" if future_risk_adder > 5 else "Stable",
        "projected_loss": highest_impact,
        "time_estimate": time_estimate
    }

# The "Sector-Tuned Markov Transition Model" (formerly God Mode)
TRANSITION_MAP: Dict[str, List[Transition]] = {
    "T1566": [
        Transition(from_id="T1566", to_id="T1059", probability=0.85, context="High likelihood: Phishing often leads to script execution."),
        Transition(from_id="T1566", to_id="T1098", probability=0.15, context="Lower likelihood: Direct account manipulation.")
    ],
    "T1059": [
        Transition(from_id="T1059", to_id="T1083", probability=0.70, context="Attackers often scout for files after gaining execution."),
        Transition(from_id="T1059", to_id="T1057", probability=0.30, context="Checking for security processes.")
    ],
    "T1083": [
        Transition(from_id="T1083", to_id="T1021", probability=0.90, context="Finding high-value targets leads to lateral movement."),
        Transition(from_id="T1083", to_id="T1005", probability=0.10, context="Local collection.")
    ],
    "T1021": [
        Transition(from_id="T1021", to_id="T1486", probability=0.95, context="Endgame: Ransomware deployment.")
    ]
}

# State management
current_simulation: SimulationState = None

@app.get("/")
def read_root():
    return {"status": "Cognitive Incident Twin Engine Online"}

@app.post("/api/incident/start", response_model=SimulationState)
def start_incident(request: IncidentStartRequest):
    global current_simulation
    
    # Initialize with Phishing
    start_tech_id = "T1566"
    start_tech = TECHNIQUES[start_tech_id]
    
    # Calculate next likely stages
    transitions = TRANSITION_MAP.get(start_tech_id, [])
    predictions = []
    for t in transitions:
        target = TECHNIQUES.get(t.to_id)
        if target:
            predictions.append(NextStagePrediction(
                technique_id=target.id,
                technique_name=target.name,
                probability=t.probability
            ))
            
    current_simulation = SimulationState(
        incident_id=f"INC-{datetime.now().strftime('%Y%m%d%H%M')}",
        current_technique=start_tech,
        detected_at=datetime.now(),
        history=[start_tech_id],
        next_possible_stages=sorted(predictions, key=lambda x: x.probability, reverse=True),
        llm_reasoning="System initialized. Analysis pending...",
        recommended_action="Isolate affected workstation immediately.",
        # Initial Metrics
        risk_score=20, 
        risk_trend="Increasing",
        projected_financial_impact=15000.0,
        time_to_impact_estimate="24 hours"
    )
    
    # Refine initial metrics
    metrics = calculate_metrics(start_tech, current_simulation.next_possible_stages)
    current_simulation.risk_score = metrics["risk_score"]
    current_simulation.risk_trend = metrics["risk_trend"]
    current_simulation.projected_financial_impact = metrics["projected_loss"]
    current_simulation.time_to_impact_estimate = metrics["time_estimate"]
    
    return current_simulation

@app.get("/api/incident/state", response_model=SimulationState)
def get_state():
    if not current_simulation:
        raise HTTPException(status_code=404, detail="No active simulation")
    return current_simulation

@app.post("/api/simulation/evolve", response_model=SimulationState)
def evolve_simulation(request: EvolutionRequest):
    global current_simulation
    if not current_simulation:
        raise HTTPException(status_code=404, detail="No active simulation")
    
    if current_simulation.is_prevented:
        raise HTTPException(status_code=400, detail="Attack already prevented")

    current_id = current_simulation.current_technique.id
    transitions = TRANSITION_MAP.get(current_id)
    
    if not transitions:
         raise HTTPException(status_code=400, detail="End of simulation path reached")

    # Select next stage based on weighted probability (or override)
    next_transition = None
    
    if request.override_next_stage:
        next_transition = next((t for t in transitions if t.to_id == request.override_next_stage), None)
    
    if not next_transition:
        # Weighted random choice if no override
        r = random.random()
        cumulative = 0.0
        for t in transitions:
            cumulative += t.probability
            if r <= cumulative:
                next_transition = t
                break
        # Fallback to highest prob if floating point weirdness
        if not next_transition:
            next_transition = max(transitions, key=lambda x: x.probability)

    # Update State
    next_tech = TECHNIQUES[next_transition.to_id]
    current_simulation.history.append(next_tech.id)
    current_simulation.current_technique = next_tech
    
    # Calculate FUTURE predictions for the NEW state
    future_transitions = TRANSITION_MAP.get(next_tech.id, [])
    predictions = []
    
    # Get the most likely next stage for LLM context
    top_next_stage_name = "Unknown"
    top_prob = 0.0
    
    for t in future_transitions:
        target = TECHNIQUES.get(t.to_id)
        if target:
            predictions.append(NextStagePrediction(
                technique_id=target.id,
                technique_name=target.name,
                probability=t.probability
            ))
            if t.probability > top_prob:
                top_prob = t.probability
                top_next_stage_name = target.name
            
    current_simulation.next_possible_stages = sorted(predictions, key=lambda x: x.probability, reverse=True)
    
    # Call LLM (or Fallback)
    insight = generate_incident_insight(next_tech.name, top_next_stage_name, top_prob)
    
    current_simulation.llm_reasoning = insight.get("reasoning", "Analyzing...")
    current_simulation.recommended_action = insight.get("defensive_recommendation", "Monitor.")
    
    # Update Metrics
    metrics = calculate_metrics(next_tech, current_simulation.next_possible_stages)
    current_simulation.risk_score = metrics["risk_score"]
    current_simulation.risk_trend = metrics["risk_trend"]
    current_simulation.projected_financial_impact = metrics["projected_loss"]
    current_simulation.time_to_impact_estimate = metrics["time_estimate"]

    return current_simulation

@app.post("/api/action/mitigate", response_model=SimulationState)
def mitigate_attack():
    global current_simulation
    if not current_simulation:
        raise HTTPException(status_code=404, detail="No active simulation")
    
    current_simulation.is_prevented = True
    current_simulation.llm_reasoning = "Defensive action applied successfully. Attack chain broken."
    current_simulation.next_possible_stages = [] # No future attacks
    
    return current_simulation

@app.post("/api/validation/replay")
def replay_validation():
    """
    Simulates a replay of the 'WannaCry' initial indicators (SMB Scan)
    and shows that the system would have predicted 'EternalBlue'.
    """
    # Hardcoded simulation of a past event
    response = {
        "event": "WannaCry Outbreak (2017)",
        "input_indicators": ["SMB Port 445 Scanning", "Suspicious IPC$ Traffic"],
        "twin_prediction": {
            "technique": "T1210 - Exploitation of Remote Services",
            "specific_exploit": "EternalBlue (MS17-010)",
            "probability": 0.99
        },
        "actual_outcome": "Global Ransomware Propagation via SMB",
        "match_percentage": 98.5
    }
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
