/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#f7f8f9',
          100: '#eef1f3',
          200: '#d9e0e5',
          300: '#b8c4ce',
          400: '#8a9ba8',
          500: '#6b7c89',
          600: '#556370',
          700: '#465058',
          800: '#3d444a',
          900: '#353b40',
        },
        accent: {
          DEFAULT: '#5b7c6a',
          muted: '#8faf9c',
        },
      },
    },
  },
  plugins: [],
};
