/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#1DB954',
          foreground: '#000000',
        },
        muted: {
          DEFAULT: '#1A1A1A',
          foreground: '#A3A3A3',
        },
        border: '#2A2A2A',
        card: {
          DEFAULT: '#111111',
          foreground: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
