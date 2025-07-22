/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0a0a0a',
        'secondary-bg': '#1a1a1a',
        'accent-green': '#00ff41',
        'accent-yellow': '#ffff00',
        'text-primary': '#ffffff',
        'text-secondary': '#cccccc',
      },
      fontFamily: {
        'graffiti': ['Impact', 'Arial Black', 'sans-serif'],
      }
    },
  },
  plugins: [],
}