/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#07090E',
          900: '#0B0F19',
          850: '#0F1523',
          800: '#141D30',
          700: '#1E2B45',
          600: '#2A3B5D',
        },
        safe: {
          50: '#ECFDF5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          glow: 'rgba(16, 185, 129, 0.4)'
        },
        caution: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          glow: 'rgba(245, 158, 11, 0.4)'
        },
        hazard: {
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          glow: 'rgba(244, 63, 94, 0.4)'
        },
        beacon: {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          glow: 'rgba(14, 165, 233, 0.4)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'neon-safe': '0 0 20px rgba(16, 185, 129, 0.35)',
        'neon-hazard': '0 0 20px rgba(244, 63, 94, 0.4)',
        'neon-beacon': '0 0 20px rgba(14, 165, 233, 0.35)',
        'neon-caution': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'strobe': 'strobe 0.8s ease-in-out infinite'
      },
      keyframes: {
        radarPing: {
          '75%, 100%': {
            transform: 'scale(2.2)',
            opacity: '0',
          },
        },
        strobe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.05)' }
        }
      }
    },
  },
  plugins: [],
}
