/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('./tailwind.preset.cjs')],
  content: ['./components/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}', './theme/**/*.{ts,tsx}'],
  plugins: [],
};
