import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, AlertTriangle, Zap } from 'lucide-react';

const InsightRow = ({ icon: Icon, label, value, color }) => (
    <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className={color} />
            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${color}`}>{label}</span>
        </div>
        <div className="pl-6 text-sm text-gray-300 font-mono leading-relaxed border-l border-gray-800">
            {value || "Waiting for data..."}
        </div>
    </div>
);

const InsightPanel = ({ simulationState }) => {
    return (
        <div className="glass-panel h-full rounded-2xl p-6 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                    <Zap className="text-cyber-green animate-pulse" size={18} />
                    <h2 className="font-display text-lg text-white tracking-wide">TACTICAL <span className="text-cyber-green">AI</span></h2>
                </div>
                <div className="text-[10px] text-cyber-green bg-cyber-green/10 px-2 py-1 rounded border border-cyber-green/20">
                    LIVE ANALYSIS
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <AnimatePresence mode="wait">
                    {simulationState ? (
                        <motion.div
                            key={simulationState.history.length} // Force re-render on state change for animation
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <InsightRow
                                icon={AlertTriangle}
                                label="Attacker Logic"
                                value={simulationState.llm_reasoning}
                                color="text-cyber-yellow"
                            />
                            {/* We need to parse goal/constraint from recommended_action or adding fields if backend sends them.
                             For now, let's just use the fields we have mapped effectively. 
                             Actually, the backend DOES NOT send 'goal'/'constraint' as top level fields in SimulationState yet,
                             it collapses them into reasoning/recommended_action. 
                             Let's stick to what we have or infer. 
                             Wait, the LLM *does* generate them, but we only store reasoning/recommendation in the Python model.
                             Task #13 added risk metrics. Task #19 enforced JSON.
                             The current `SimulationState` in models.py has `llm_reasoning` and `recommended_action`.
                             Let's simulate the structured look for now.
                         */}

                            <InsightRow
                                icon={Target}
                                label="Projected Impact"
                                value={`Financial Exposure: $${simulationState.projected_financial_impact?.toLocaleString()}`}
                                color="text-cyber-red"
                            />

                            <div className="mt-8 pt-4 border-t border-gray-800">
                                <InsightRow
                                    icon={Shield}
                                    label="Countermeasure"
                                    value={simulationState.recommended_action}
                                    color="text-cyber-blue"
                                />
                                {simulationState.recommended_action && !simulationState.is_prevented && (
                                    <div className="ml-6 mt-2">
                                        <span className="text-[10px] text-cyber-blue animate-pulse">
                                            ➤ READY FOR DEPLOYMENT
                                        </span>
                                    </div>
                                )}
                            </div>

                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                            <span className="text-xs font-mono">AWAITING TELEMETRY...</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Decoration */}
            <div className="absolute bottom-0 right-0 p-4 opacity-20 pointer-events-none">
                <Shield size={120} className="text-cyber-gray" />
            </div>
        </div>
    );
};

export default InsightPanel;
