/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kevin Sans"', 'system-ui', 'sans-serif'],
        hand: ['"Kevin Sans Hand"', '"Kevin Sans"', 'cursive'],
        script: ['"Kevin Sans Script"', '"Kevin Sans"', 'cursive'],
        sketch: ['"Kevin Sans Hand"', '"Kevin Sans"', 'cursive'],
      },
      colors: {
        honey: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
    },
  },
  plugins: [],
};
