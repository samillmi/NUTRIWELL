/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // We won't trigger dark mode so it stays light
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          DEFAULT: '#ecfdf5', // emerald-50 (light green bg)
          card:    '#f8fdfa', // very light mint for cards (no longer pure white)
          border:  '#d1fae5', // emerald-100 border
          muted:   '#dcfce7', // green-100 muted
        },
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        'card-gradient':  'linear-gradient(145deg, #f8fdfa, #ecfdf5)',
        'brand-gradient': 'linear-gradient(135deg, #10b981, #34d399)', // Pure green gradient
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-glow':   'pulseGlow 2s infinite',
        'spin-slow':    'spin 3s linear infinite',
        'shimmer':      'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                      to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' }, '50%': { boxShadow: '0 0 20px 10px rgba(16, 185, 129, 0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow-teal':    '0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.1)',
        'glow-purple':  '0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 8px 10px -6px rgba(59, 130, 246, 0.1)',
        'card':         '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.025)',
      },
    },
  },
  plugins: [],
};
