/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../libs/ui/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/components/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/modules/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/helpers/**/*.{js,ts,jsx,tsx}',
    '../../libs/ui/theme/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};
