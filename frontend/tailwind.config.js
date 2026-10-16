/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          dark: '#123D32',       // Vert foncé
          primary: '#21845B',    // Vert principal
          light: '#E2F3E8',      // Vert très clair
          bg: '#F4F7F5',         // Gris clair fond
          blue: '#3478B8',       // Bleu énergétique
          warning: '#E9A23B',    // Orange avertissement
          danger: '#D9534F',     // Rouge critique
          slate: '#2C3E50',
          border: '#D8E2DC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
