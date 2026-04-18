/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
        secondary: { DEFAULT: '#10B981', light: '#34D399', dark: '#059669' },
        accent: { DEFAULT: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
      },
    },
  },
  plugins: [],
};
