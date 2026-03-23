/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bolao-green': '#0A7C4E',
        'bolao-green-light': '#E8F5EF',
        'bolao-green-mid': '#B6DECA',
        'bolao-green-accent': '#12A066',
        'bolao-gold': '#9A6D08',
        'bolao-gold-light': '#FDF5E0',
        'bolao-red': '#C0392B',
        'bolao-red-light': '#FDECEA',
        'bolao-bg': '#F5F3EE',
        'bolao-bg-card': '#FFFFFF',
        'bolao-border': '#DDD9D0',
        'bolao-text': '#1A1916',
        'bolao-muted': '#7A7768',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        display: ['Bebas Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}