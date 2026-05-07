/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#252532',
        },
        blood: {
          500: '#dc2626',
          600: '#b91c1c',
        },
        ghost: {
          400: 'rgba(139, 92, 246, 0.4)',
          500: 'rgba(139, 92, 246, 0.5)',
          600: 'rgba(139, 92, 246, 0.6)',
        }
      },
      animation: {
        'danmaku': 'danmaku 8s linear infinite',
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'flicker': 'flicker 0.5s ease-in-out infinite',
      },
      keyframes: {
        danmaku: {
          '0%': { transform: 'translateX(100%)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0.3' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(220, 38, 38, 0.6)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
