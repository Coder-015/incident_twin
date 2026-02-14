import React, { useState } from 'react';
import axios from 'axios';
import { Play, ShieldAlert, CheckCircle, Flame, Clock, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import AttackGraph from './components/AttackGraph';
import InsightPanel from './components/InsightPanel';
import RiskGauge from './components/RiskGauge';

const API_BASE = "http://127.0.0.1:8000/api";

function App() {
    const [simulationState, setSimulationState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [validationMode, setValidationMode] = useState(false);

    const [error, setError] = useState(null);

    // API Handlers (Keep logic, update UI)
    const startSimulation = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Calling /incident/start...");
            const res = await axios.post(`${API_BASE}/incident/start`, { sector: "Finance" });
            console.log("Success:", res.data);
            setSimulationState(res.data);
        } catch (e) {
            console.error("API Error:", e);
            const msg = e.response?.data?.detail || e.message;
            setError(`FAILED: ${msg}. Check backend console.`);
            alert(`API ERROR: ${msg}\nEnsure Backend is running on Port 8000.`);
        } finally { setLoading(false); }
    };

    const evolveSimulation = async () => {
        if (!simulationState) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE}/simulation/evolve`, { incident_id: simulationState.incident_id });
            setSimulationState(res.data);
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.detail || e.message;
            setError(msg);
            alert(`EVOLVE ERROR: ${msg}`);
        } finally { setLoading(false); }
    };

    const mitigateAttack = async () => {
        if (!simulationState) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE}/action/mitigate`);
            setSimulationState(res.data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally { setLoading(false); }
    };

    const replayValidation = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE}/validation/replay`);
            alert(`VALIDATION RESULT:\nMatch Rate: ${res.data.match_percentage}%\nPrediction: ${res.data.twin_prediction.specific_exploit}`);
        } catch (e) {
            console.error(e);
            alert("Validation Replay Failed: " + e.message);
        } finally { setLoading(false); }
    }

    return (
        <div className="min-h-screen bg-cyber-dark text-gray-200 font-sans selection:bg-cyber-blue selection:text-black overflow-hidden relative">

            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-20"></div>
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyber-blue/10 to-transparent pointer-events-none"></div>

            {/* Main Container */}
            <div className="flex flax-col h-screen p-6 gap-6 relative z-10">

                {/* LEFT PANEL: INTELLIGENCE */}
                <div className="w-80 flex flex-col gap-6">
                    {/* Branding */}
                    <div className="glass-panel p-6 rounded-2xl border-l-4 border-cyber-blue">
                        <h1 className="font-display text-2xl text-white tracking-widest">COGNITIVE<br /><span className="text-cyber-blue">TWIN</span></h1>
                        <p className="text-[10px] text-gray-400 mt-2 tracking-[0.2em] uppercase">Predictive Cyber Engine</p>
                    </div>

                    {/* Risk Module */}
                    <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            <Activity size={14} className="text-cyber-red animate-pulse" />
                            <span className="text-[10px] uppercase text-cyber-red tracking-widest">Risk Telemetry</span>
                        </div>

                        {simulationState ? (
                            <>
                                <RiskGauge score={simulationState.risk_score} />

                                <div className="w-full mt-8 space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                        <span className="text-xs text-gray-400 font-mono">Time to Impact</span>
                                        <span className="text-cyber-blue font-mono font-bold animate-pulse">{simulationState.time_to_impact_estimate}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                        <span className="text-xs text-gray-400 font-mono">Prediction Conf.</span>
                                        <span className="text-cyber-green font-mono font-bold">92.4%</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-gray-600 font-mono text-center">SYSTEM IDLE</div>
                        )}
                    </div>

                    {/* System Status */}
                    <div className="glass-panel p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${simulationState ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className="text-xs font-mono text-gray-300">ENGINE STATUS: {simulationState ? 'ONLINE' : 'STANDBY'}</span>
                        </div>
                        {error && (
                            <div className="mt-2 text-[10px] text-red-500 font-mono border border-red-500/50 p-2 rounded bg-red-500/10">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER PANEL: VISUALIZATION */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Hero Graph */}
                    <div className="flex-1 relative">
                        <AttackGraph simulationState={simulationState} />
                    </div>

                    {/* Bottom Controls */}
                    <div className="h-20 glass-panel rounded-2xl flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            {!simulationState ? (
                                <ControlBtn
                                    icon={ShieldAlert}
                                    label="INJECT ALERT"
                                    color="text-cyber-red border-cyber-red hover:bg-cyber-red/10"
                                    onClick={startSimulation}
                                    disabled={loading}
                                />
                            ) : (
                                <>
                                    <ControlBtn
                                        icon={Play}
                                        label="SIMULATE FUTURE"
                                        color="text-cyber-blue border-cyber-blue hover:bg-cyber-blue/10"
                                        onClick={evolveSimulation}
                                        disabled={loading || simulationState.is_prevented}
                                    />
                                    <ControlBtn
                                        icon={CheckCircle}
                                        label="DEPLOY MITIGATION"
                                        color="text-cyber-green border-cyber-green hover:bg-cyber-green/10"
                                        onClick={mitigateAttack}
                                        disabled={loading || simulationState.is_prevented}
                                    />
                                </>
                            )}
                        </div>

                        {/* Validation Toggle */}
                        <div className="flex items-center gap-4 border-l border-gray-700 pl-8">
                            <button
                                onClick={replayValidation}
                                className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
                            >
                                <RefreshCw size={14} />
                                REPLAY HISTORICAL (VALIDATION)
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: TACTICAL INSIGHT */}
                <div className="w-80 h-full">
                    <InsightPanel simulationState={simulationState} />
                </div>

            </div>
        </div>
    );
}

const ControlBtn = ({ icon: Icon, label, color, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            group flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300
            ${color} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}
        `}
    >
        <Icon size={18} className="group-hover:animate-bounce" />
        <span className="font-display text-xs tracking-widest font-bold">{label}</span>
    </button>
);

export default App;
