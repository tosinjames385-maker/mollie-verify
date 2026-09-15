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
        warning: '#F5C400',
        page: '#070B13',
        card: '#0D141E',
        panel: '#111A25',
        borderline: '#1D2936',
        text: {
          main: '#F1F5F9',
          sec: '#94A3B8',
          muted: '#64748B',
        },
        dark: {
          50: '#1D2936',
          100: '#111A25',
          200: '#0D141E',
          300: '#070B13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
