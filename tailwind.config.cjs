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
        "primary": "#4A90E2",
        "background-light": "#F0F4F8",
        "background-dark": "#1A202C",
        "success": "#48BB78",
        "accent": "#F6AD55",
        "vibrant-blue": "#3B82F6",
        "text-light": "#F7FAFC",
        "text-dark": "#2D3748",
        "module-bg-light": "#FFFFFF",
        "module-bg-dark": "#2D3748",
        "border-light": "#E2E8F0",
        "border-dark": "rgba(255, 255, 255, 0.1)",
        "text-muted-light": "#718096",
        "text-muted-dark": "#A0AEC0",
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'subtle-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
