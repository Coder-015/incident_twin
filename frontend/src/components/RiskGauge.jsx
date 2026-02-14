import React from 'react';
import { motion } from 'framer-motion';

const RiskGauge = ({ score }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Color logic
    let color = '#00f0ff'; // Blue (Low)
    if (score > 40) color = '#fcee0a'; // Yellow (Med)
    if (score > 75) color = '#ff2a6d'; // Red (High)

    return (
        <div className="relative flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold text-white tracking-widest">{score}</span>
                    <span className="text-[10px] uppercase text-gray-400 tracking-widest">Risk Index</span>
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
