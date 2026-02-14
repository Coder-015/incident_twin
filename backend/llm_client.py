import requests
import json
import random
from typing import Dict, Any

# Ollama Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral" # User can change this to 'llama3' or 'gemma'

def generate_incident_insight(current_stage: str, next_stage: str, probability: float) -> Dict[str, str]:
    """
    Generates reasoning, goals, and recommendations using Ollama.
    Falls back to hardcoded responses if Ollama is unreachable.
    """
    
    prompt = f"""
    You are a Cyber Threat Intelligence Analyst. 
    Analyze a Digital Twin simulation of a Ransomware attack on a Finance Sector target.
    
    Current Stage: {current_stage}
    Likely Next Stage: {next_stage} (Probability: {int(probability * 100)}%)
    
    Explain WHY the attacker is moving this way.
    
    STRICT OUTPUT RULES:
    1. Return ONLY valid JSON.
    2. Do not include commentary.
    3. Do not include markdown formatting (backticks).
    4. Do not include explanation outside JSON.
    
    JSON Schema:
    {{
        "reasoning": "One concise sentence explaining technical motivation.",
        "goal": "What they want (e.g., Maintain Persistence).",
        "constraint": "One limitation they face.",
        "defensive_recommendation": "One specific technical action to block this."
    }}
    """
    
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=5) 
        
        if response.status_code == 200:
            data = response.json()
            # Double check it is valid JSON before returning
            parsed = json.loads(data["response"])
            return parsed
    except Exception as e:
        print(f"LLM Error (using fallback): {e}")
    except Exception as e:
        print(f"LLM Error (using fallback): {e}")
        
    # Fallback / Mock Reponses for Demo Stability
    return get_fallback_insight(current_stage)

def get_fallback_insight(stage_name: str) -> Dict[str, str]:
    """Hardcoded insights for the specific demo scenario."""
    
    if "Phishing" in stage_name:
        return {
            "reasoning": "Attacker is leveraging social engineering to bypass perimeter firewalls.",
            "goal": "Gain Initial Access",
            "constraint": "Must avoid email filters",
            "defensive_recommendation": "Quarantine email and reset user credentials."
        }
    elif "Command" in stage_name or "PowerShell" in stage_name:
        return {
            "reasoning": "PowerShell is used to execute code in memory, avoiding disk-based detection.",
            "goal": "Execution",
            "constraint": "Must bypass PowerShell Execution Policy",
            "defensive_recommendation": "Enable Constrained Language Mode and Script Block Logging."
        }
    elif "Discovery" in stage_name:
        return {
            "reasoning": "Scanning for high-value targets (File Servers, Domain Controllers).",
            "goal": "Lateral Movement Planning",
            "constraint": "Excessive scanning triggers IDS",
            "defensive_recommendation": "Isolate host and block SMB (Port 445) traffic."
        }
    elif "Lateral" in stage_name:
        return {
            "reasoning": "Moving towards critical infrastructure using compromised credentials.",
            "goal": "Domain Dominance",
            "constraint": "Needs valid admin credentials",
            "defensive_recommendation": "Reset KRBTGT account and force immediate re-authentication."
        }
    elif "Encrypted" in stage_name:
        return {
            "reasoning": "Finalizing objective by denying access to critical data.",
            "goal": "Financial Extortion",
            "constraint": "Encryption is CPU intensive",
            "defensive_recommendation": "Sever network connection immediately to halt propagation."
        }
    
    return {
        "reasoning": "Standard attack progression observed.",
        "goal": "Unknown",
        "constraint": "None detected",
        "defensive_recommendation": "Monitor for further anomalies."
    }
