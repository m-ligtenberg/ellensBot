/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired color palette
        'apple': {
          'gray': {
            50: '#ffffff',
            100: '#f5f5f7',
            200: '#f2f2f7',
            300: '#e5e5ea',
            400: '#d1d1d6',
            500: '#8e8e93',
            600: '#636366',
            700: '#48484a',
            800: '#3a3a3c',
            900: '#1c1c1e',
          },
          'blue': '#007aff',
          'green': '#34c759',
          'orange': '#ff9500',
          'red': '#ff3b30',
          'purple': '#af52de',
          'pink': '#ff2d92',
          'yellow': '#ffcc00',
        },
        // Legacy colors for compatibility
        'accent-green': '#34c759',
        'accent-yellow': '#ffcc00',
        'text-primary': '#1c1c1e',
        'text-secondary': '#8e8e93',
      },
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'apple-mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'minimal': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}