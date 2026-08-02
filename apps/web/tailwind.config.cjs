/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../libs/ui/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/components/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/lib/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/theme/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};
