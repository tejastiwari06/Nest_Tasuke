/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#08070D',
        elevated: '#100D17',
        secondary: '#171020',
        violet: {
          primary: '#7C3AED',
          bright: '#8B5CF6',
          lavender: '#B69AFF',
        },
        threat: '#FF4D5E',
        warning: '#F5B942',
        success: '#43D9A3',
        'text-main': '#F7F4FC',
        'text-secondary': '#A49AAF',
        border: 'rgba(190, 160, 255, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'violet-glow': 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        'threat-glow': 'radial-gradient(ellipse at 50% 0%, rgba(255, 77, 94, 0.1) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'waveform': 'waveform 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.5)' },
        }
      },
      boxShadow: {
        'violet-sm': '0 0 12px rgba(124, 58, 237, 0.2)',
        'violet-md': '0 0 24px rgba(124, 58, 237, 0.3)',
        'threat-sm': '0 0 12px rgba(255, 77, 94, 0.25)',
      }
    },
  },
  plugins: [],
}
