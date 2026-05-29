/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verde:    { DEFAULT:'#1A5C2A', act:'#2D9E4E', ac:'#4FCB6B', s:'#EAF3DE', n:'#0F2415' },
        ambar:    { DEFAULT:'#EF9F27', s:'#FFF8E1' },
        azul:     { DEFAULT:'#185FA5', s:'#E6F1FB' },
        rojo:     { DEFAULT:'#E24B4A', s:'#FFEBEE' },
        carbon:   '#2C2C2A',
        gris:     '#5F5E5A',
        tierra:   '#F1EFE8',
        borde:    '#D3D1C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
