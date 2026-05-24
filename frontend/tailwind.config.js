/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      animation: {
        shine: 'shine 1.5s ease-out infinite',
        fadeIn: 'fadeIn 0.4s ease-out forwards',
        slideUp: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideLeft: 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(250%) skewX(-12deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      },
    },
  },
  plugins: [
    // Adds custom delays like animation-delay-100 to orchestrate staggered layouts
    function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-100': { 'animation-delay': '100ms' },
        '.animation-delay-200': { 'animation-delay': '200ms' },
        '.animation-delay-300': { 'animation-delay': '300ms' },
        '.animation-delay-400': { 'animation-delay': '400ms' },
        '.animation-delay-500': { 'animation-delay': '500ms' },
      })
    }
  ],
}