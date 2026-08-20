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
        terracotta: {
          DEFAULT: '#D36B4E',
          hover: '#E27B5E',
          dark: '#B5553B',
          light: 'rgba(211, 107, 78, 0.15)',
          border: 'rgba(211, 107, 78, 0.35)',
        },
        tealglaze: {
          DEFAULT: '#3AB4B9',
          hover: '#4FC5CA',
          dark: '#2B9297',
          light: 'rgba(58, 180, 185, 0.15)',
          border: 'rgba(58, 180, 185, 0.35)',
        },
        coffee: {
          950: '#0A0A0A', // Deep Obsidian Charcoal
          900: '#121212', // Wet Clay Dark
          850: '#181615',
          800: '#1D1B1A', // Roasted Coffee Dark
          750: '#24201E',
          700: '#2D2825',
          600: '#3D3632',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FAF6F0', // Soft Warm Cream
          200: '#F0EAE1',
          300: '#D6CBC0',
          400: '#A49690', // Terracotta Dust Grey
          500: '#756863',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-terracotta': '0 0 25px -4px rgba(211, 107, 78, 0.35)',
        'glow-teal': '0 0 25px -4px rgba(58, 180, 185, 0.35)',
        'card-warm': '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(250, 246, 240, 0.07)',
      },
      borderRadius: {
        'clay': '55% 45% 52% 48% / 45% 55% 45% 55%',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
