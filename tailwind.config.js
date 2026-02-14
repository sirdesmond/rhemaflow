// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'electric-purple': '#7C3AED',
        'deep-purple': '#4C1D95',
        'fire-orange': '#F59E0B',
        'divine-gold': '#FBBF24',
        'void-black': '#0F172A',
      },
      fontFamily: {
        'display': ['Cinzel'],
        'heading': ['PlayfairDisplay'],
        'body': ['Lato'],
        'body-bold': ['Lato-Bold'],
      },
    },
  },
  plugins: [],
};
