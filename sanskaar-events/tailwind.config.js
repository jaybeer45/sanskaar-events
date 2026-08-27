/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#ec3013',
          'red-hover': '#d4270f',
          dark: '#201e1d',
          gold: '#f5a623',
          'gold-hover': '#e09510',
        },
        surface: {
          DEFAULT: '#fafafa',
          dark: '#111111',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1e1e1e',
        },
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#2d2d2d',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.14)',
        brand: '0 4px 20px rgba(236,48,19,0.3)',
      },
      animation: {
        'pulse-live': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(24px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
