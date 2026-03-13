/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./routes/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#F59E0B",           // amber-400
        "primary-dark": "#D97706",      // amber-600
        "primary-glow": "rgba(245, 158, 11, 0.45)",
        "secondary": "#4ADE80",         // green-400
        "background-light": "#FDFAF4",
        "background-dark": "#0C0A06",   // deep warm black
        "success": "#4ADE80",
        "accent": "#F59E0B",
        "vibrant-green": "#4ADE80",
        "text-light": "#FDF8EE",
        "text-dark": "#1C1208",
        "module-bg-light": "#FFFCF0",
        "module-bg-dark": "rgba(22, 18, 8, 0.6)",
        "border-light": "#E8D9B8",
        "border-dark": "rgba(245, 158, 11, 0.12)",
        "text-muted-light": "#6B5B3E",
        "text-muted-dark": "#A09070",
      },
      fontFamily: {
        "display": ["Fraunces", "Georgia", "serif"],
        "body": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'subtle-dark': '0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 0 rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.15)',
        'neon': '0 0 8px rgba(245, 158, 11, 0.25), 0 0 20px rgba(245, 158, 11, 0.15)',
        'amber': '0 4px 20px rgba(245, 158, 11, 0.25)',
        'green': '0 4px 20px rgba(74, 222, 128, 0.20)',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
