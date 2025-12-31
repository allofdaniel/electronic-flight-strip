/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ATC Color Scheme
        'atc': {
          'bg': '#1a1a2e',
          'panel': '#16213e',
          'surface': '#0f3460',
          'accent': '#e94560',
        },
        // Strip Colors
        'strip': {
          'departure': '#22c55e',      // Green
          'arrival': '#3b82f6',        // Blue
          'warning': '#eab308',        // Yellow
          'danger': '#ef4444',         // Red
          'neutral': '#6b7280',        // Gray
          'overflight': '#f97316',     // Orange
        },
        // Safety Net Alert Colors
        'alert': {
          'caution': '#fbbf24',
          'warning': '#f97316',
          'critical': '#dc2626',
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'atc': ['Roboto Mono', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      spacing: {
        'strip-height': '80px',
        'bay-width': '320px',
      },
    },
  },
  plugins: [],
};
