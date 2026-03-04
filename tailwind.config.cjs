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
        "primary": "#8B5CF6", // Violet 500
        "primary-dark": "#7C3AED", // Violet 600
        "primary-glow": "rgba(139, 92, 246, 0.5)",
        "secondary": "#06b6d4", // Cyan 500
        "background-light": "#f8fafc",
        "background-dark": "#0B0F19", // Deep Navy
        "success": "#10b981",
        "accent": "#8B5CF6",
        "vibrant-blue": "#06b6d4",
        "text-light": "#f1f5f9",
        "text-dark": "#1e293b",
        "module-bg-light": "#ffffff",
        "module-bg-dark": "rgba(255, 255, 255, 0.03)",
        "border-light": "#e5e7eb",
        "border-dark": "rgba(255, 255, 255, 0.08)",
        "text-muted-light": "#64748b",
        "text-muted-dark": "#94a3b8",
      },
      fontFamily: {
        "display": ["Outfit", "sans-serif"],
        "body": ["Inter", "sans-serif"],
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
        'subtle-dark': '0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(139, 92, 246, 0.15)',
        'neon': '0 0 8px rgba(139, 92, 246, 0.2), 0 0 16px rgba(139, 92, 246, 0.15)',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
