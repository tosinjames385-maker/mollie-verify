/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B7F34A',
        teal: '#00D2B8',
        warning: '#F5C400',
        page: '#070A0F',
        card: '#0A1017',
        panel: '#0F151E',
        borderline: '#1C2838',
        text: {
          main: '#F1F5F9',
          sec: '#94A3B8',
          muted: '#64748B',
        },
        dark: {
          50: '#1C2838',
          100: '#141B24',
          200: '#0F151E',
          300: '#0A1017',
          400: '#070A0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}