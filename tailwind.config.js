/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        rice: {
          50: '#FBF8F1',
          100: '#F5F0E6',
          200: '#E8DFC9',
          300: '#D4C49D',
          400: '#BFA573',
        },
        bronze: {
          50: '#F5EFE7',
          100: '#E8D9C2',
          200: '#CFAE87',
          300: '#A87E52',
          400: '#8B5E3C',
          500: '#6F4A2E',
          600: '#5A3B24',
          700: '#472E1C',
        },
        ink: {
          50: '#F0EDE8',
          100: '#6B645A',
          200: '#4A4338',
          300: '#2C2416',
          400: '#1A150D',
        },
        cinnabar: {
          100: '#F4D5D2',
          200: '#E49E98',
          300: '#D27068',
          400: '#B94E48',
          500: '#943A36',
        },
        bamboo: {
          100: '#DCE6DB',
          200: '#A8BEA6',
          300: '#7A9B78',
          400: '#6B8E6A',
          500: '#547254',
        },
        rattan: {
          100: '#F0E0B4',
          200: '#E3C97D',
          300: '#D4A84B',
          400: '#B4892E',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"思源黑体"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'paper-texture': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        'bamboo-lines': `repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(107, 94, 60, 0.12) 8px, rgba(107, 94, 60, 0.12) 9px)`,
      },
      boxShadow: {
        'paper': '0 1px 2px rgba(44,36,22,0.08), 0 4px 12px rgba(44,36,22,0.06)',
        'paper-hover': '0 2px 6px rgba(44,36,22,0.12), 0 8px 24px rgba(44,36,22,0.10)',
      },
    },
  },
  plugins: [],
};
