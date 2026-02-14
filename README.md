# Cognitive Incident Twin - Predictive Cyber Attack Simulator

# Cognitive Incident Twin - Sector-Tuned Predictive Engine

## 1. The Core Concept (Refined)
**Problem:** Traditional SOC platforms such as SIEM and EDR operate **reactively** — alerting only *after* indicators are detected.
**Solution:** Cognitive Incident Twin builds a dynamic **probabilistic model** of an active incident and simulates its likely future trajectory.

It functions as a **forward-looking attack evolution engine**, providing:
1.  **Sector-Tuned Markov Transition Model**: 
    *   MITRE ATT&CK-based state transitions.
    *   Weighted using ransomware campaign behavioral patterns.
    *   Finance-sector bias applied to technique probabilities.
2.  **Dynamic Risk Index**: 
    *   Quantitative **0–100** risk score.
    *   Time-to-impact estimation & projected financial exposure.
3.  **Generative Tactical Reasoning**: 
    *   Context-aware explanation of attacker intent.
    *   Constraint modeling (evasion, off-hours behavior, tooling limitations).

---

## 2. Technical Architecture

### **The "Brain" (Backend)**
*   **Engine**: Python + FastAPI.
*   **Simulation Model**: 
    *   **Transition Model Design**: Directed weighted graph with First-order Markov assumption.
    *   **Weight Logic**: `Base MITRE Prob * Sector Multiplier * Campaign Bias`.
*   **Risk Index Model**:
    ```math
    Risk Score (0–100) = (Transition Probability * Impact Severity Weight * Proximity Factor) * 100
    ```
    *   *Where Proximity Factor increases as simulation approaches T1486 (Encryption).*

### **The "Face" (Frontend)**
*   **Visual Feedback**:
    *   Current attack stage **pulses red**.
    *   Predicted branches **glow** proportionally to probability.
    *   **"Time to Impact"** counter increases dynamically.
    *   **Mitigation** causes branch collapse animation.

---

## 3. End-to-End Data Flow

1.  **Injest**: User triggers `Simulate Phishing Alert` -> `POST /api/incident/start`.
2.  **Initialize**: 
    *   Twin Engine instantiates a new `TwinState`.
    *   Calculates initial **Risk Score** (weighted by technique severity).
3.  **Predict**:
    *   Engine queries the **Transition Matrix** for probable next steps.
    *   Frontend renders the initial node and likely future paths.
4.  **Evolve**:
    *   User clicks `Simulate Future` -> `POST /api/simulation/evolve`.
    *   Engine computes the next state using weighted probabilities.
    *   **Financial Impact Model** updates: `Impact = Future_Prob * Technique_Severity_Cost`.
5.  **Reason**:
    *   LLM generates a tactical summary: "Why is the attacker moving from T1059 (PowerShell) to T1083 (File Discovery)?"
6.  **Mitigate**:
    *   User deploys a countermeasure.
    *   Engine prunes the future probability tree, dropping Risk Score to 0.

---

## 4. Differentiators

### **Predictive Instead of Reactive**
*   Traditional SOC tools correlate *past* alerts.
*   The Twin simulates *forward* states to preempt damage.

### **Probabilistic Pruning After Mitigation**
*   When a defensive action is deployed:
    *   Downstream transitions are **pruned**.
    *   Risk index recalculates instantly.
    *   Future branches collapse visually.

### **Validation via Historical Replay**
*   Replay early-stage signals from **WannaCry** or **SolarWinds**.
*   **Result**: The model assigns the highest transition probability to lateral exploitation techniques consistent with known historical outcomes (e.g., EternalBlue propagation).

## 5. Comparison to Existing Systems

| Feature | Traditional SIEM | SOAR | **Cognitive Incident Twin** |
| :--- | :---: | :---: | :---: |
| Alert Correlation | ✅ | ✅ | ✅ |
| Automated Response | ❌ | ✅ | ✅ |
| **Future Simulation** | ❌ | ❌ | ✅ |
| **Probabilistic Risk Projection** | ❌ | ❌ | ✅ |

## 5. Project Structure

*   **/backend**: All the logic.
    *   `main.py`: The API server and Simulation Engine.
    *   `models.py`: The data structures (Technique, State).
    *   `llm_client.py`: The connector to Ollama (Text generation).
*   **/frontend**: All the visuals.
    *   `src/components/AttackGraph.jsx`: The D3.js visualization code.
    *   `src/App.jsx`: The main dashboard layout and button logic.
 
## How to run

*    **Quick Start (Windows)**
     * Clone the repository.
     * Run restart.bat This script automatically installs dependencies and launches both servers.
*    **Manual Start**
     * Backend: cd backend && python -m uvicorn main:app --reload --port 8000
     * Frontend: cd frontend && npm run dev
