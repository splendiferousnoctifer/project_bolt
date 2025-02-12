/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#f3f4f6',
          dark: '#111827',
        },
        secondary: {
          light: '#ffffff',
          dark: '#1f2937',
        },
        text: {
          light: '#111827',
          dark: '#f9fafb',
        },
        accent: {
          light: '#3b82f6',
          dark: '#60a5fa',
        }
      }
    },
  },
  plugins: [],
};