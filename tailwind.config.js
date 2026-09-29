/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // 深林黑 — 最深底色
        ink: {
          DEFAULT: '#101713',
          50:  '#1a221e',
          100: '#161e1a',
          200: '#121a16',
          300: '#0e1612',
          400: '#0b110e',
          500: '#080d0b',
        },
        // 深森林绿 — 次级背景
        forest: {
          50:  '#f3f6f4',
          100: '#e1ebe5',
          200: '#c3d6cb',
          300: '#9bbba8',
          400: '#6e9a83',
          500: '#4f7d67',
          600: '#3d6452',
          700: '#325043',
          800: '#2a4138',
          900: '#243C30',  // 深森林绿
          950: '#17251D',  // 更深
          1000: '#0d1410',
        },
        // 山雾白
        mist: {
          DEFAULT: '#F4F1E8',
          50:  '#faf9f4',
          100: '#F4F1E8',
          200: '#e8e4d6',
          300: '#d4cfc0',
        },
        // 岩石灰
        rock: {
          DEFAULT: '#A9ADA5',
          50:  '#eceeeb',
          100: '#d8dad5',
          200: '#c2c5be',
          300: '#A9ADA5',  // 岩石灰主色
          400: '#8e928b',
          500: '#73756f',
        },
        // 苔藓绿
        moss: {
          DEFAULT: '#8DAA91',
          50:  '#eef4f0',
          100: '#d8e6db',
          200: '#b3ccb8',
          300: '#8DAA91',  // 苔藓绿主色
          400: '#6d8a72',
          500: '#506b54',
        },
        // 日落金 — 仅作强调色
        gold: {
          DEFAULT: '#D7A85C',
          50:  '#fdf6ea',
          100: '#f5e1c0',
          200: '#D7A85C',  // 日落金主色
          300: '#c49640',
          400: '#a87d30',
          500: '#8a6428',
        },
        // 兼容旧引用
        stone2: {
          50:  '#f7f6f3',
          100: '#ebe8e1',
          200: '#d6cfc2',
          300: '#bdb19c',
          400: '#a5957b',
          500: '#907e63',
          600: '#796651',
          700: '#5f4f3f',
          800: '#453a30',
          900: '#2f2822'
        },
        sand: {
          50:  '#fbf7ef',
          100: '#f3ead5',
          200: '#e6d2a9',
          300: '#d4b376',
          400: '#c49851',
          500: '#b3813d',
          600: '#9a6832',
          700: '#7e502a',
          800: '#654128',
          900: '#533623'
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif'],
        mono: ['"SF Mono"', '"Cascadia Code"', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',   // 10px
        '3xs': '0.5rem',      // 8px
      },
      borderRadius: {
        xl2: '14px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(20,40,30,0.06)',
        glass: '0 2px 20px rgba(0,0,0,0.15), 0 0 1px rgba(255,255,255,0.1) inset',
        deep: '0 4px 32px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    }
  },
  plugins: []
}
