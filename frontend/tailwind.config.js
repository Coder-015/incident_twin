/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    dark: '#050a14',
                    gray: '#0f172a',
                    blue: '#00f0ff',
                    red: '#ff2a6d',
                    green: '#05ffa1',
                    yellow: '#fcee0a',
                    dim: 'rgba(0, 240, 255, 0.1)',
                }
            },
            fontFamily: {
                mono: ['Space Mono', 'monospace'],
                sans: ['Inter', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'],
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
            },
            animation: {
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff' },
                    '100%': { boxShadow: '0 0 20px #00f0ff, 0 0 30px #00f0ff' },
                }
            }
        },
    },
    plugins: [],
}
