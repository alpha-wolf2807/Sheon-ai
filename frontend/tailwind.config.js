/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lavender: { DEFAULT: '#C8A2FF', light: '#DEC5FF', dark: '#A875FF' },
        violet: { DEFAULT: '#5B2EFF', dark: '#4520CC', light: '#7A56FF' },
        coral: { DEFAULT: '#FF6F61', light: '#FF9088', dark: '#E55548' },
        maatri: {
          bg: '#0A0614',
          surface: '#130D24',
          card: '#1C1335',
          border: '#2D1F4E'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'maatri-gradient': 'linear-gradient(135deg, #5B2EFF 0%, #C8A2FF 50%, #FF6F61 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(200,162,255,0.15) 0%, rgba(91,46,255,0.08) 100%)'
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(91,46,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow-violet': '0 0 40px rgba(91,46,255,0.4)',
        'glow-lavender': '0 0 30px rgba(200,162,255,0.3)',
        'glow-coral': '0 0 30px rgba(255,111,97,0.4)',
        'card': '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,162,255,0.1)'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(91,46,255,0.4)' },
          '50%': { opacity: 0.7, boxShadow: '0 0 40px rgba(91,46,255,0.8)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      }
    }
  },
  plugins: []
}
