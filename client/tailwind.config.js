/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uno: {
          red: '#ff5555',
          blue: '#5555ff',
          green: '#55ff55',
          yellow: '#ffff55',
          dark: '#1a1a24',
          darker: '#0d0d14',
          accent: '#9d00ff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
