
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#0d9488', // Teal 600
          secondary: '#3b82f6', // Blue 500
          navy: '#0f172a', // Slate 900
          'navy-light': '#1e293b', // Slate 800
          accent: '#0d9488', // Teal 600
          'accent-light': '#ccfbf1', // Teal 100
          success: '#10b981', // Emerald 500
          warning: '#f59e0b', // Amber 500
          danger: '#ef4444', // Red 500
          'bg-soft': '#f8fafc', // Slate 50
          'slate-dark': '#2F3A4A',
          'slate-muted': '#64748B',
          'nav-inactive': '#E6E8EB',
          'nav-hover': 'rgba(255, 255, 255, 0.12)',
          'teal-deep': '#0B5F5A',
          'teal-hover': '#094C48',
          'teal-press': '#073C38',
          'teal-disabled': '#9CA3AF',
          'live': '#14B8A6',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(79, 70, 229, 0.15)',
        'neon': '0 0 10px rgba(79, 70, 229, 0.5), 0 0 20px rgba(79, 70, 229, 0.3)',
        'premium': '0 10px 28px rgba(0,0,0,0.35)',
        'live-glow': '0 0 0 4px rgba(20,184,166,0.25)',
        'btn-teal': '0 8px 20px -4px rgba(20,184,166,0.35), 0 4px 8px -2px rgba(20,184,166,0.15)',
        'card-hover': '0 20px 40px rgba(0,0,0,0.07), 0 0 0 1px rgba(20,184,166,0.08)',
        'dropdown': '0 18px 40px rgba(0,0,0,0.35)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
        'entrance': '500ms',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'page-enter': 'pageEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'dropdown-in': 'dropdownIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'success-pop': 'successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'trust-pop': 'trustRingPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dropdownIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        successPop: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        trustRingPop: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
