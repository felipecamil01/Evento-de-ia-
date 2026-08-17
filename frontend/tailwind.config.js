/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f11',
        sidebar: '#18181b',
        border: '#2a2a2e',
        primary: '#7c6af7',
        primaryHover: '#8f7eff',
        textPrimary: '#f0f0f0',
        textSecondary: '#888',
        success: '#60e0a0',
        warning: '#ffb060',
        error: '#ff8080',
        layerChao: '#4ade80',
        layerMobiliario: '#818cf8',
        layerTeto: '#fb923c'
      }
    },
  },
  plugins: [],
}
